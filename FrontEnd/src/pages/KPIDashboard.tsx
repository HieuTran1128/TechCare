import React, { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { motion } from 'framer-motion';
import {
  ResponsiveContainer,
  BarChart,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Bar,
  LineChart,
  Line,
  Legend,
} from 'recharts';
import { Download, Filter, Gauge, HandCoins, ListChecks, TrendingUp } from 'lucide-react';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api';

type GroupBy = 'week' | 'month';
type SortBy = 'revenue' | 'performance';

interface TechnicianKPI {
  technicianId: string;
  technicianName: string;
  totalOrders: number;
  completedOrders: number;
  rejectedOrders: number;
  totalRevenue: number;
  completionRate: number;
  rejectionRate: number;
  avgLeadTime: number;
}

interface PeriodSummary {
  period: string;
  totalRevenue: number;
  totalOrders: number;
  completedOrders: number;
  rejectedOrders: number;
  completionRate: number;
  rejectionRate: number;
}

interface KpiResponse {
  groupBy: GroupBy;
  range: {
    startDate: string | null;
    endDate: string | null;
  };
  technicians: TechnicianKPI[];
  periodSummary: PeriodSummary[];
}

function formatCurrency(value: number) {
  return `${Math.round(value).toLocaleString('vi-VN')} ₫`;
}

function formatPercent(value: number) {
  return `${value.toFixed(1)}%`;
}

function formatLeadTime(value: number) {
  return `${value.toFixed(2)} giờ`;
}

function dateInputValue(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function normalizeErrorMessage(err: any) {
  const message = err?.response?.data?.message;

  if (typeof message === 'string' && message.trim()) return message;
  if (Array.isArray(message)) return message.map((m) => (typeof m === 'string' ? m : JSON.stringify(m))).join(', ');
  if (message && typeof message === 'object') {
    if (typeof message.error === 'string') return message.error;
    if (typeof message.details === 'string') return message.details;
    return JSON.stringify(message);
  }
  if (typeof err?.message === 'string' && err.message.trim()) return err.message;

  return 'Không thể tải dữ liệu KPI';
}

export const KPIDashboard: React.FC = () => {
  const now = new Date();
  const [groupBy, setGroupBy] = useState<GroupBy>('week');
  const [sortBy, setSortBy] = useState<SortBy>('revenue');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const [startDate, setStartDate] = useState<string>(dateInputValue(new Date(now.getFullYear(), now.getMonth(), 1)));
  const [endDate, setEndDate] = useState<string>(dateInputValue(now));

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

      const res = await axios.get<KpiResponse>(`${API_BASE}/kpi`, {
        withCredentials: true,
        params: { startDate, endDate, groupBy },
      });

      setData(res.data);
    } catch (err: any) {
      setError(normalizeErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData().catch(() => undefined);
  }, []);

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

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  const pagedTechnicians = useMemo(() => {
    const start = (page - 1) * pageSize;
    return sortedTechnicians.slice(start, start + pageSize);
  }, [sortedTechnicians, page, pageSize]);

  const summaryCards = useMemo(() => {
    const totalOrders = data.technicians.reduce((sum, item) => sum + item.totalOrders, 0);
    const completedOrders = data.technicians.reduce((sum, item) => sum + item.completedOrders, 0);
    const rejectedOrders = data.technicians.reduce((sum, item) => sum + item.rejectedOrders, 0);
    const totalRevenue = data.technicians.reduce((sum, item) => sum + item.totalRevenue, 0);
    const avgLeadTime = completedOrders
      ? data.technicians.reduce((sum, item) => sum + item.avgLeadTime * item.completedOrders, 0) / completedOrders
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
      'Technician',
      'TotalOrders',
      'CompletedOrders',
      'RejectedOrders',
      'CompletionRate(%)',
      'RejectionRate(%)',
      'AvgLeadTime(Hours)',
      'TotalRevenue',
    ];

    const rows = sortedTechnicians.map((item) => [
      `"${item.technicianName.replaceAll('"', '""')}"`,
      item.totalOrders,
      item.completedOrders,
      item.rejectedOrders,
      item.completionRate.toFixed(2),
      item.rejectionRate.toFixed(2),
      item.avgLeadTime.toFixed(2),
      item.totalRevenue.toFixed(0),
    ]);

    const csvContent = [headers.join(','), ...rows.map((row) => row.join(','))].join('\n');
    const blob = new Blob([`\uFEFF${csvContent}`], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `kpi-${groupBy}-${startDate}-${endDate}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const setThisWeek = () => {
    const current = new Date();
    const day = current.getDay();
    const diff = day === 0 ? 6 : day - 1;
    const monday = new Date(current);
    monday.setDate(current.getDate() - diff);

    setStartDate(dateInputValue(monday));
    setEndDate(dateInputValue(current));
    setGroupBy('week');
  };

  const setThisMonth = () => {
    const current = new Date();
    const firstDay = new Date(current.getFullYear(), current.getMonth(), 1);

    setStartDate(dateInputValue(firstDay));
    setEndDate(dateInputValue(current));
    setGroupBy('month');
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-3">
        <div>
        </div>
        <div className="flex flex-wrap gap-2">
          <button onClick={setThisWeek} className="px-3 py-2 rounded-xl border border-slate-200 bg-white text-sm font-semibold">Tuần này</button>
          <button onClick={setThisMonth} className="px-3 py-2 rounded-xl border border-slate-200 bg-white text-sm font-semibold">Tháng này</button>
          <button onClick={exportCSV} className="px-3 py-2 rounded-xl bg-indigo-600 text-white text-sm font-semibold inline-flex items-center gap-2">
            <Download size={15} /> Export CSV
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        {[
          { label: 'Doanh thu', value: formatCurrency(summaryCards.totalRevenue), icon: HandCoins, tone: 'from-emerald-500 to-teal-500' },
          { label: 'Đơn hàng', value: summaryCards.totalOrders, icon: ListChecks, tone: 'from-indigo-500 to-violet-500' },
          { label: 'Tỷ lệ hoàn thành', value: formatPercent(summaryCards.completionRate), icon: TrendingUp, tone: 'from-sky-500 to-blue-500' },
          { label: 'Lead time trung bình', value: formatLeadTime(summaryCards.avgLeadTime), icon: Gauge, tone: 'from-amber-500 to-orange-500' },
        ].map((card, index) => {
          const Icon = card.icon;
          return (
            <motion.div
              key={card.label}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="rounded-2xl border border-slate-200 bg-white p-4 shadow-[0_8px_24px_rgba(2,6,23,.06)]"
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

      <div className="rounded-2xl border border-slate-200 bg-white p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-3">
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
          <button onClick={() => fetchData()} className="w-full px-3 py-2 rounded-xl bg-slate-900 text-white inline-flex items-center justify-center gap-2 font-semibold">
            <Filter size={14} /> Áp dụng
          </button>
        </div>
      </div>

      {error && <div className="text-sm text-rose-700 bg-rose-50 border border-rose-200 rounded-xl p-3">{error}</div>}

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <div className="bg-white rounded-2xl border p-4 h-[320px]">
          <h3 className="font-semibold mb-3">Doanh thu theo {groupBy === 'week' ? 'tuần' : 'tháng'}</h3>
          <ResponsiveContainer width="100%" height="90%">
            <BarChart data={data.periodSummary}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="period" />
              <YAxis />
              <Tooltip formatter={(value: number | string | undefined) => formatCurrency(Number(value ?? 0))} />
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
                    <th className="py-2 pr-3">Thời gian sửa chữa TB</th>
                    <th className="py-2 pr-3">Tỷ lệ hoàn thành (%)</th>
                    <th className="py-2 pr-3">Tỷ lệ từ chối (%)</th>
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
                      <td className="py-2 pr-3">{formatLeadTime(item.avgLeadTime)}</td>
                      <td className="py-2 pr-3 text-emerald-700">{formatPercent(item.completionRate)}</td>
                      <td className="py-2 pr-3 text-rose-700">{formatPercent(item.rejectionRate)}</td>
                      <td className="py-2 pr-3 font-semibold">{formatCurrency(item.totalRevenue)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="mt-4 flex items-center justify-between gap-3">
              <p className="text-xs text-slate-500">Trang {page}/{totalPages} • Tổng {sortedTechnicians.length} kỹ thuật viên</p>
              <div className="flex gap-2">
                <button className="px-3 py-1.5 border rounded-lg disabled:opacity-40" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page <= 1}>Trước</button>
                <button className="px-3 py-1.5 border rounded-lg disabled:opacity-40" onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page >= totalPages}>Sau</button>
              </div>
            </div>
          </>
        )}
      </section>
    </div>
  );
};