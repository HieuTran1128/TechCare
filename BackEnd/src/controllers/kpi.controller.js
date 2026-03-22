const kpiService = require('../services/kpi.service');

exports.getKpi = async (req, res) => {
  try {
    const data = await kpiService.getKpi({
      startDate: req.query.startDate,
      endDate: req.query.endDate,
      groupBy: req.query.groupBy || 'week',
    });

    res.json(data);
  } catch (err) {
    res.status(400).json({
      message: err.message || 'Không thể lấy dữ liệu KPI',
    });
  }
};
