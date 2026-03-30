import React, { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import {
  ResponsiveContainer, BarChart, CartesianGrid, XAxis, YAxis,
  Tooltip, Bar, LineChart, Line, Legend,
} from 'recharts';
import { Download, Filter, Gauge, HandCoins, ListChecks, TrendingUp } from 'lucide-react';
import { kpiService } from '../services';
import type { KpiResponse } from '../services/kpi.service';

type GroupBy = 'week' | 'month';
type SortBy = 'revenue' | 'performance';

const fmt = (v: number) => `${Math.round(v).toLocaleString('vi-VN')} ₫`;
const fmtPct = (v: number) => `${v.toFixed(1)}%`;
const fmtTime = (v: number) => `${v.toFixed(2)} giờ`;
const dateVal = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

export const KPIDashboard: React.FC = () => {
  const now = new Date();
  const [groupBy, setGroupBy] = useState<GroupBy>('week');
  const [sortBy, setSortBy] = useState<SortBy>('revenue');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [startDate, setStartDate] = useState(dateVal(new Date(now.getFullYear(), now.getMonth(), 1)));
  const [endDate, setEndDate] = useState(dateVal(now));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [data, setData] = useState<KpiResponse>({
    groupBy: 'week',
    range: { startDate: null, endDate: null },
    technicians: [],
    periodSummary: [],
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await kpiService.get({ startDate, endDate, groupBy });
      setData(res);
    } catch (err: any) {
      const msg = err?.response?.data?.message;
      setError(typeof msg === 'string' ? msg : 'Không thể tải dữ liệu KPI');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const sortedTechnicians = useMemo(() => {
    const clone = [...data.technicians];
    if (sortBy === 'performance') {
      clone.sort((a, b) => b.completionRate - a.completionRate || b.totalRevenue - a.totalRevenue);
    } else {
      clone.sort((a, b) => b.totalRevenue - a.totalRevenue || b.completionRate - a.completionRate);
    }
    return clone;
  }, [data.technicians, sortBy]);

  const totalPages = Math.max(1, Math.ceil(sortedTechnicians.length / pageSize));
  useEffect(() => { if (page > totalPages) setPage(totalPages); }, [page, totalPages]);

  const pagedTechnicians = useMemo(
    () => sortedTechnicians.slice((page - 1) * pageSize, page * pageSize),
    [sortedTechnicians, page, pageSize],
  );

  const summaryCards = useMemo(() => {
    const totalOrders = data.technicians.reduce((s, i) => s + i.totalOrders, 0);
    const completedOrders = data.technicians.reduce((s, i) => s + i.completedOrders, 0);
    const rejectedOrders = data.technicians.reduce((s, i) => s + i.rejectedOrders, 0);
    const totalRevenue = data.technicians.reduce((s, i) => s + i.totalRevenue, 0);
    const avgLeadTime = completedOrders
      ? data.technicians.reduce((s, i) => s + i.avgLeadTime * i.completedOrders, 0) / completedOrders
      : 0;
    return {
      totalOrders,
      completedOrders,
      rejectedOrders,
      totalRevenue,
      completionRate: totalOrders ? (completedOrders / totalOrders) * 100 : 0,
      rejectionRate: totalOrders ? (rejectedOrders / totalOrders) * 100 : 0,
      avgLeadTime,
    };
  }, [data.technicians]);

  const exportCSV = () => {
    const headers = [
      'Technician', 'TotalOrders', 'CompletedOrders', 'RejectedOrders',
      'CompletionRate(%)', 'RejectionRate(%)', 'AvgLeadTime(Hours)', 'TotalRevenue',
    ];
    const rows = sortedTechnicians.map((i) => [
      `"${i.technicianName.replaceAll('"', '""')}"`,
      i.totalOrders, i.completedOrders, i.rejectedOrders,
      i.completionRate.toFixed(2), i.rejectionRate.toFixed(2),
      i.avgLeadTime.toFixed(2), i.totalRevenue.toFixed(0),
    ]);
    const csv = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `kpi-${groupBy}-${startDate}-${endDate}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const setThisWeek = () => {
    const d = new Date();
    const diff = d.getDay() === 0 ? 6 : d.getDay() - 1;
    const mon = new Date(d);
    mon.setDate(d.getDate() - diff);
    setStartDate(dateVal(mon));
    setEndDate(dateVal(d));
    setGroupBy('week');
  };

  const setThisMonth = () => {
    const d = new Date();
    setStartDate(dateVal(new Date(d.getFullYear(), d.getMonth(), 1)));
    setEndDate(dateVal(d));
    setGroupBy('month');
  };

  const cards = [
    { label: 'Doanh thu', value: fmt(summaryCards.totalRevenue), icon: HandCoins, tone: 'from-emerald-500 to-teal-500' },
    { label: 'Đơn hàng', value: summaryCards.totalOrders, icon: ListChecks, tone: 'from-indigo-500 to-violet-500' },
    { label: 'Tỷ lệ hoàn thành', value: fmtPct(summaryCards.completionRate), icon: TrendingUp, tone: 'from-sky-500 to-blue-500' },
    { label: 'Lead time trung bình', value: fmtTime(summaryCards.avgLeadTime), icon: Gauge, tone: 'from-amber-500 to-orange-500' },
  ];

  return (
    <div className="space-y-6">
      {/* Header actions */}
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-3">
        <div />
        <div className="flex flex-wrap gap-2">
          <button onClick={setThisWeek} className="px-3 py-2 rounded-xl border bg-white text-sm font-semibold">Tuần này</button>
          <button onClick={setThisMonth} className="px-3 py-2 rounded-xl border bg-white text-sm font-semibold">Tháng này</button>
          <button onClick={exportCSV} className="px-3 py-2 rounded-xl bg-indigo-600 text-white text-sm font-semibold inline-flex items-center gap-2">
            <Download size={15} /> Export CSV
          </button>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        {cards.map((card, index) => {
          const Icon = card.icon;
          return (
            <motion.div
              key={card.label}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="rounded-2xl border bg-white p-4 shadow-sm"
            >
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs uppercase tracking-[0.15em] text-slate-500">{card.label}</p>
                  <p className="text-2xl font-extrabold mt-2">{card.value}</p>
                </div>
                <div className={`h-10 w-10 rounded-xl bg-gradient-to-br ${card.tone} text-white grid place-items-center`}>
                  <Icon size={18} />
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Filters */}
      <div className="rounded-2xl border bg-white p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-3">
        <div>
          <label className="text-xs text-slate-500">Từ ngày</label>
          <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="mt-1 w-full border rounded-xl px-3 py-2" />
        </div>
        <div>
          <label className="text-xs text-slate-500">Đến ngày</label>
          <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="mt-1 w-full border rounded-xl px-3 py-2" />
        </div>
        <div>
          <label className="text-xs text-slate-500">Nhóm theo</label>
          <select value={groupBy} onChange={(e) => setGroupBy(e.target.value as GroupBy)} className="mt-1 w-full border rounded-xl px-3 py-2">
            <option value="week">Tuần</option>
            <option value="month">Tháng</option>
          </select>
        </div>
        <div>
          <label className="text-xs text-slate-500">Sắp xếp</label>
          <select value={sortBy} onChange={(e) => setSortBy(e.target.value as SortBy)} className="mt-1 w-full border rounded-xl px-3 py-2">
            <option value="revenue">Theo doanh thu</option>
            <option value="performance">Theo hiệu suất</option>
          </select>
        </div>
        <div>
          <label className="text-xs text-slate-500">Số dòng / trang</label>
          <select value={pageSize} onChange={(e) => setPageSize(Number(e.target.value))} className="mt-1 w-full border rounded-xl px-3 py-2">
            <option value={5}>5</option>
            <option value={10}>10</option>
            <option value={20}>20</option>
          </select>
        </div>
        <div className="flex items-end">
          <button onClick={fetchData} className="w-full px-3 py-2 rounded-xl bg-slate-900 text-white inline-flex items-center justify-center gap-2 font-semibold">
            <Filter size={14} /> Áp dụng
          </button>
        </div>
      </div>

      {error && <div className="text-sm text-rose-700 bg-rose-50 border border-rose-200 rounded-xl p-3">{error}</div>}

      {/* Charts */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <div className="bg-white rounded-2xl border p-4 h-[320px]">
          <h3 className="font-semibold mb-3">Doanh thu theo {groupBy === 'week' ? 'tuần' : 'tháng'}</h3>
          <ResponsiveContainer width="100%" height="90%">
            <BarChart data={data.periodSummary} margin={{ top: 4, right: 8, left: 16, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="period" />
              <YAxis width={80} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
              <Tooltip formatter={(v: number | string | undefined) => fmt(Number(v ?? 0))} />
              <Bar dataKey="totalRevenue" fill="#4f46e5" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="bg-white rounded-2xl border p-4 h-[320px]">
          <h3 className="font-semibold mb-3">Hiệu suất theo {groupBy === 'week' ? 'tuần' : 'tháng'}</h3>
          <ResponsiveContainer width="100%" height="90%">
            <LineChart data={data.periodSummary}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="period" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="completionRate" name="Hoàn thành %" stroke="#16a34a" strokeWidth={2} />
              <Line type="monotone" dataKey="rejectionRate" name="Từ chối %" stroke="#dc2626" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Table */}
      <section className="bg-white rounded-2xl border p-4">
        <h3 className="font-semibold mb-3">KPI theo kỹ thuật viên</h3>
        {loading ? (
          <p className="text-sm text-slate-500">Đang tải dữ liệu...</p>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left border-b text-slate-500">
                    <th className="py-2 pr-3">Kỹ thuật viên</th>
                    <th className="py-2 pr-3">Tổng đơn</th>
                    <th className="py-2 pr-3">Hoàn thành</th>
                    <th className="py-2 pr-3">Từ chối</th>
                    <th className="py-2 pr-3">Thời gian sửa TB</th>
                    <th className="py-2 pr-3">Tỷ lệ HT (%)</th>
                    <th className="py-2 pr-3">Tỷ lệ TC (%)</th>
                    <th className="py-2 pr-3">Doanh thu</th>
                  </tr>
                </thead>
                <tbody>
                  {pagedTechnicians.map((item) => (
                    <tr key={item.technicianId} className="border-b last:border-b-0">
                      <td className="py-2 pr-3 font-medium">{item.technicianName}</td>
                      <td className="py-2 pr-3">{item.totalOrders}</td>
                      <td className="py-2 pr-3">{item.completedOrders}</td>
                      <td className="py-2 pr-3">{item.rejectedOrders}</td>
                      <td className="py-2 pr-3">{fmtTime(item.avgLeadTime)}</td>
                      <td className="py-2 pr-3 text-emerald-700">{fmtPct(item.completionRate)}</td>
                      <td className="py-2 pr-3 text-rose-700">{fmtPct(item.rejectionRate)}</td>
                      <td className="py-2 pr-3 font-semibold">{fmt(item.totalRevenue)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="mt-4 flex items-center justify-between gap-3">
              <p className="text-xs text-slate-500">
                Trang {page}/{totalPages} • Tổng {sortedTechnicians.length} kỹ thuật viên
              </p>
              <div className="flex gap-2">
                <button
                  className="px-3 py-1.5 border rounded-lg disabled:opacity-40"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page <= 1}
                >
                  Trước
                </button>
                <button
                  className="px-3 py-1.5 border rounded-lg disabled:opacity-40"
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page >= totalPages}
                >
                  Sau
                </button>
              </div>
            </div>
          </>
        )}
      </section>
    </div>
  );
};
