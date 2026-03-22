const RepairTicket = require('../models/repairTicket.model');

function parseDateRange(startDate, endDate) {
  const start = startDate ? new Date(startDate) : null;
  const end = endDate ? new Date(endDate) : null;

  if ((startDate && Number.isNaN(start?.getTime())) || (endDate && Number.isNaN(end?.getTime()))) {
    throw new Error('startDate hoặc endDate không hợp lệ');
  }

  if (start && end && start > end) {
    throw new Error('startDate phải nhỏ hơn hoặc bằng endDate');
  }

  return { start, end };
}

function buildDateMatch(start, end) {
  if (!start && !end) return {};

  const match = {};
  if (start) match.$gte = start;
  if (end) {
    const inclusiveEnd = new Date(end);
    inclusiveEnd.setHours(23, 59, 59, 999);
    match.$lte = inclusiveEnd;
  }

  return { createdAt: match };
}

function getPeriodExpression(groupBy) {
  if (groupBy === 'month') {
    return {
      $dateToString: {
        format: '%Y-%m',
        date: '$createdAt',
        timezone: 'Asia/Ho_Chi_Minh',
      },
    };
  }

  return {
    $concat: [
      { $toString: { $isoWeekYear: '$createdAt' } },
      '-W',
      {
        $cond: [
          { $lt: [{ $isoWeek: '$createdAt' }, 10] },
          { $concat: ['0', { $toString: { $isoWeek: '$createdAt' } }] },
          { $toString: { $isoWeek: '$createdAt' } },
        ],
      },
    ],
  };
}

async function getKpi({ startDate, endDate, groupBy = 'week' }) {
  if (!['week', 'month'].includes(groupBy)) {
    throw new Error('groupBy chỉ chấp nhận week hoặc month');
  }

  const { start, end } = parseDateRange(startDate, endDate);
  const dateMatch = buildDateMatch(start, end);
  const periodExpression = getPeriodExpression(groupBy);

  const rows = await RepairTicket.aggregate([
    { $match: { ...dateMatch, technician: { $ne: null } } },
    {
      $lookup: {
        from: 'users',
        localField: 'technician',
        foreignField: '_id',
        as: 'technicianInfo',
      },
    },
    {
      $unwind: {
        path: '$technicianInfo',
        preserveNullAndEmptyArrays: true,
      },
    },
    {
      $addFields: {
        period: periodExpression,
        leadTimeHours: {
          $cond: [
            {
              $and: [
                { $eq: ['$status', 'COMPLETED'] },
                { $ne: ['$completedAt', null] },
              ],
            },
            {
              $divide: [
                { $subtract: ['$completedAt', '$createdAt'] },
                1000 * 60 * 60,
              ],
            },
            null,
          ],
        },
        revenueValue: {
          $cond: [{ $eq: ['$status', 'COMPLETED'] }, { $ifNull: ['$finalCost', 0] }, 0],
        },
      },
    },
    {
      $group: {
        _id: {
          technicianId: '$technician',
          technicianName: { $ifNull: ['$technicianInfo.fullName', 'Chưa rõ kỹ thuật viên'] },
          period: '$period',
        },
        totalOrders: { $sum: 1 },
        completedOrders: {
          $sum: { $cond: [{ $eq: ['$status', 'COMPLETED'] }, 1, 0] },
        },
        rejectedOrders: {
          $sum: { $cond: [{ $eq: ['$status', 'CUSTOMER_REJECTED'] }, 1, 0] },
        },
        avgLeadTime: { $avg: '$leadTimeHours' },
        totalRevenue: { $sum: '$revenueValue' },
      },
    },
    {
      $project: {
        _id: 0,
        technicianId: '$_id.technicianId',
        technicianName: '$_id.technicianName',
        period: '$_id.period',
        totalOrders: 1,
        completedOrders: 1,
        rejectedOrders: 1,
        completionRate: {
          $cond: [
            { $eq: ['$totalOrders', 0] },
            0,
            { $multiply: [{ $divide: ['$completedOrders', '$totalOrders'] }, 100] },
          ],
        },
        rejectionRate: {
          $cond: [
            { $eq: ['$totalOrders', 0] },
            0,
            { $multiply: [{ $divide: ['$rejectedOrders', '$totalOrders'] }, 100] },
          ],
        },
        avgLeadTime: { $ifNull: ['$avgLeadTime', 0] },
        totalRevenue: 1,
      },
    },
    { $sort: { totalRevenue: -1 } },
  ]);

  const technicianMap = new Map();
  const periodMap = new Map();

  rows.forEach((row) => {
    const techKey = String(row.technicianId);
    const current = technicianMap.get(techKey) || {
      technicianId: row.technicianId,
      technicianName: row.technicianName,
      totalOrders: 0,
      completedOrders: 0,
      rejectedOrders: 0,
      totalRevenue: 0,
      leadTimeSum: 0,
      leadTimeCountWeight: 0,
      completionRate: 0,
      rejectionRate: 0,
      avgLeadTime: 0,
      periods: [],
    };

    current.totalOrders += row.totalOrders;
    current.completedOrders += row.completedOrders;
    current.rejectedOrders += row.rejectedOrders;
    current.totalRevenue += row.totalRevenue;
    current.leadTimeSum += row.avgLeadTime * row.completedOrders;
    current.leadTimeCountWeight += row.completedOrders;

    current.periods.push({
      period: row.period,
      totalRevenue: row.totalRevenue,
      completionRate: row.completionRate,
      rejectionRate: row.rejectionRate,
      avgLeadTime: row.avgLeadTime,
      totalOrders: row.totalOrders,
    });

    technicianMap.set(techKey, current);

    const periodAgg = periodMap.get(row.period) || {
      period: row.period,
      totalRevenue: 0,
      totalOrders: 0,
      completedOrders: 0,
      rejectedOrders: 0,
    };

    periodAgg.totalRevenue += row.totalRevenue;
    periodAgg.totalOrders += row.totalOrders;
    periodAgg.completedOrders += row.completedOrders;
    periodAgg.rejectedOrders += row.rejectedOrders;
    periodMap.set(row.period, periodAgg);
  });

  const technicians = Array.from(technicianMap.values())
    .map((item) => {
      const totalOrders = item.totalOrders || 0;
      const completedOrders = item.completedOrders || 0;
      const rejectedOrders = item.rejectedOrders || 0;

      return {
        technicianId: item.technicianId,
        technicianName: item.technicianName,
        totalOrders,
        completedOrders,
        rejectedOrders,
        totalRevenue: item.totalRevenue,
        completionRate: totalOrders ? (completedOrders / totalOrders) * 100 : 0,
        rejectionRate: totalOrders ? (rejectedOrders / totalOrders) * 100 : 0,
        avgLeadTime: item.leadTimeCountWeight ? item.leadTimeSum / item.leadTimeCountWeight : 0,
        periods: item.periods.sort((a, b) => a.period.localeCompare(b.period)),
      };
    })
    .sort((a, b) => b.totalRevenue - a.totalRevenue);

  const periodSummary = Array.from(periodMap.values())
    .map((period) => ({
      ...period,
      completionRate: period.totalOrders ? (period.completedOrders / period.totalOrders) * 100 : 0,
      rejectionRate: period.totalOrders ? (period.rejectedOrders / period.totalOrders) * 100 : 0,
    }))
    .sort((a, b) => a.period.localeCompare(b.period));

  return {
    groupBy,
    range: {
      startDate: start || null,
      endDate: end || null,
    },
    technicians,
    periodSummary,
  };
}

module.exports = {
  getKpi,
};
