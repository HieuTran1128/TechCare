import React, { useEffect, useState } from 'react';
import axios from 'axios';
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, LineChart, Line,
} from 'recharts';
import { Filter, Download, PackageSearch, TrendingUp, Wallet, ArrowLeftRight } from 'lucide-react';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api';
type GroupBy = 'week' | 'month';

interface PeriodRow { period: string; totalImportCost: number; totalImportQty: number; importCount: number; totalOutRevenue: number; totalOutQty: number; outCount: number; margin: number; }
interface TopPart { partId: string; partName: string; brand: string; currentStock: number; sellPrice: number; totalQty: number; totalRevenue: number; usageCount: number; }
interface TopImportPart { partId: string; partName: string; brand: string; currentStock: number; sellPrice: number; totalImportQty: number; totalImportCost: number; avgImportPrice: number; importCount: number; }
interface KpiSummary { totalStockValue: number; totalImportCost: number; totalOutRevenue: number; totalMargin: number; totalImportQty: number; totalOutQty: number; turnoverRate: number; }
interface InventoryKpiData { groupBy: GroupBy; summary: KpiSummary; periodSummary: PeriodRow[]; topConsumptionParts: TopPart[]; topImportParts: TopImportPart[]; }

const fmt = (v: number) => `${Math.round(v).toLocaleString('vi-VN')} ₫`;
const fmtNum = (v: number) => v.toLocaleString('vi-VN');
const fmtPct = (v: number) => `${v.toFixed(1)}%`;
function dateStr(d: Date) { return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; }

const InventoryKPI: React.FC = () => {
  const now = new Date();
  const [groupBy, setGroupBy] = useState<GroupBy>('month');
  const [startDate, setStartDate] = useState(dateStr(new Date(now.getFullYear(), now.getMonth() - 2, 1)));
  const [endDate, setEndDate] = useState(dateStr(now));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [data, setData] = useState<InventoryKpiData | null>(null);

  const fetchKpi = async () => {
    try {
      setLoading(true); setError('');
      const res = await axios.get<InventoryKpiData>(`${API_BASE}/parts/kpi`, { withCredentials: true, params: { startDate, endDate, groupBy } });
      setData(res.data);
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Không thể tải KPI kho');
    } finally { setLoading(false); }
  };

  useEffect(() => { fetchKpi(); }, []);

  const exportCSV = () => {
    if (!data) return;
    const headers = ['Kỳ', 'Chi phí nhập (₫)', 'SL nhập', 'Doanh thu xuất (₫)', 'SL xuất', 'Margin (₫)'];
    const rows = data.periodSummary.map((p) => [p.period, Math.round(p.totalImportCost), p.totalImportQty, Math.round(p.totalOutRevenue), p.totalOutQty, Math.round(p.margin)]);
    const csv = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = `kpi-kho-${startDate}-${endDate}.csv`; a.click();
    URL.revokeObjectURL(url);
  };

  const s = data?.summary;
  const summaryCards = [
    { label: 'Giá trị tồn kho', value: fmt(s?.totalStockValue ?? 0), icon: PackageSearch, tone: 'from-indigo-500 to-violet-500' },
    { label: 'Chi phí nhập kỳ này', value: fmt(s?.totalImportCost ?? 0), icon: Wallet, tone: 'from-amber-500 to-orange-500' },
    { label: 'Doanh thu linh kiện', value: fmt(s?.totalOutRevenue ?? 0), icon: TrendingUp, tone: 'from-emerald-500 to-teal-500' },
    { label: 'Margin linh kiện', value: fmt(s?.totalMargin ?? 0), icon: ArrowLeftRight, tone: s && s.totalMargin >= 0 ? 'from-sky-500 to-blue-500' : 'from-rose-500 to-red-500' },
  ];

  return (
    <div className="space-y-5">
      <div className="bg-white border rounded-2xl p-4 flex flex-wrap gap-3 items-end shadow-sm">
        <div><label className="text-xs text-slate-500">Từ ngày</label><input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="mt-1 block border rounded-xl px-3 py-2 text-sm" /></div>
        <div><label className="text-xs text-slate-500">Đến ngày</label><input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="mt-1 block border rounded-xl px-3 py-2 text-sm" /></div>
        <div>
          <label className="text-xs text-slate-500">Nhóm theo</label>
          <select value={groupBy} onChange={(e) => setGroupBy(e.target.value as GroupBy)} className="mt-1 block border rounded-xl px-3 py-2 text-sm">
            <option value="week">Tuần</option>
            <option value="month">Tháng</option>
          </select>
        </div>
        <button onClick={fetchKpi} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-900 text-white text-sm font-semibold"><Filter size={14} /> Áp dụng</button>
        <button onClick={exportCSV} disabled={!data} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 text-white text-sm font-semibold disabled:opacity-40"><Download size={14} /> Export CSV</button>
      </div>

      {error && <div className="text-sm text-rose-700 bg-rose-50 border border-rose-200 rounded-xl p-3">{error}</div>}
      {loading && <p className="text-sm text-slate-500">Đang tải dữ liệu KPI kho...</p>}

      {data && (
        <>
          <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
            {summaryCards.map((card) => {
              const Icon = card.icon;
              return (
                <div key={card.label} className="bg-white border rounded-2xl p-4 shadow-sm flex items-center justify-between gap-3">
                  <div><p className="text-xs uppercase tracking-wide text-slate-500">{card.label}</p><p className="text-xl font-extrabold mt-1">{card.value}</p></div>
                  <div className={`h-10 w-10 rounded-xl bg-gradient-to-br ${card.tone} text-white grid place-items-center shrink-0`}><Icon size={18} /></div>
                </div>
              );
            })}
          </div>

          <div className="grid grid-cols-3 gap-4">
            {[
              { label: 'Tổng SL nhập', value: fmtNum(s?.totalImportQty ?? 0) + ' cái' },
              { label: 'Tổng SL xuất', value: fmtNum(s?.totalOutQty ?? 0) + ' cái' },
              { label: 'Tỷ lệ tiêu thụ', value: fmtPct(s?.turnoverRate ?? 0) },
            ].map((item) => (
              <div key={item.label} className="bg-white border rounded-2xl p-3 shadow-sm">
                <p className="text-xs text-slate-500">{item.label}</p>
                <p className="text-lg font-bold mt-1">{item.value}</p>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
            <div className="bg-white border rounded-2xl p-4 shadow-sm">
              <h3 className="font-semibold text-sm mb-3">Chi phí nhập vs Doanh thu xuất ({groupBy === 'week' ? 'tuần' : 'tháng'})</h3>
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={data.periodSummary} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="period" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                  <Tooltip formatter={(v: number) => fmt(v)} />
                  <Legend />
                  <Bar dataKey="totalImportCost" name="Chi phí nhập" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="totalOutRevenue" name="Doanh thu xuất" fill="#10b981" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="bg-white border rounded-2xl p-4 shadow-sm">
              <h3 className="font-semibold text-sm mb-3">Margin linh kiện theo {groupBy === 'week' ? 'tuần' : 'tháng'}</h3>
              <ResponsiveContainer width="100%" height={260}>
                <LineChart data={data.periodSummary} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="period" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                  <Tooltip formatter={(v: number) => fmt(v)} />
                  <Legend />
                  <Line type="monotone" dataKey="margin" name="Margin (₫)" stroke="#6366f1" strokeWidth={2} dot={{ r: 3 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>

            <div className="bg-white border rounded-2xl p-4 shadow-sm">
              <h3 className="font-semibold text-sm mb-3">Số lượng nhập vs xuất theo {groupBy === 'week' ? 'tuần' : 'tháng'}</h3>
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={data.periodSummary} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="period" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip /><Legend />
                  <Bar dataKey="totalImportQty" name="SL nhập" fill="#818cf8" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="totalOutQty" name="SL xuất" fill="#34d399" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="bg-white border rounded-2xl p-4 shadow-sm">
              <h3 className="font-semibold text-sm mb-3">Số lần nhập / xuất kho theo {groupBy === 'week' ? 'tuần' : 'tháng'}</h3>
              <ResponsiveContainer width="100%" height={260}>
                <LineChart data={data.periodSummary} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="period" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip /><Legend />
                  <Line type="monotone" dataKey="importCount" name="Lần nhập" stroke="#f59e0b" strokeWidth={2} dot={{ r: 3 }} />
                  <Line type="monotone" dataKey="outCount" name="Lần xuất" stroke="#10b981" strokeWidth={2} dot={{ r: 3 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-white border rounded-2xl p-4 shadow-sm">
            <h3 className="font-semibold text-sm mb-3">Top 10 linh kiện tiêu thụ nhiều nhất</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 text-slate-500">
                  <tr>
                    <th className="px-3 py-2 text-left">#</th>
                    <th className="px-3 py-2 text-left">Linh kiện</th>
                    <th className="px-3 py-2 text-left">Hãng</th>
                    <th className="px-3 py-2 text-right">SL xuất</th>
                    <th className="px-3 py-2 text-right">Số lần dùng</th>
                    <th className="px-3 py-2 text-right">Doanh thu</th>
                    <th className="px-3 py-2 text-right">Tồn hiện tại</th>
                  </tr>
                </thead>
                <tbody>
                  {data.topConsumptionParts.map((p, i) => (
                    <tr key={p.partId} className="border-t border-slate-100 hover:bg-slate-50/60">
                      <td className="px-3 py-2 text-slate-400 font-mono">{i + 1}</td>
                      <td className="px-3 py-2 font-medium">{p.partName}</td>
                      <td className="px-3 py-2 text-slate-500">{p.brand || '—'}</td>
                      <td className="px-3 py-2 text-right font-semibold">{fmtNum(p.totalQty)}</td>
                      <td className="px-3 py-2 text-right">{p.usageCount}</td>
                      <td className="px-3 py-2 text-right text-emerald-700 font-semibold">{fmt(p.totalRevenue)}</td>
                      <td className={`px-3 py-2 text-right font-semibold ${p.currentStock <= 0 ? 'text-rose-600' : p.currentStock <= 5 ? 'text-amber-600' : 'text-slate-700'}`}>{fmtNum(p.currentStock)}</td>
                    </tr>
                  ))}
                  {data.topConsumptionParts.length === 0 && <tr><td colSpan={7} className="px-3 py-4 text-center text-slate-400 text-sm">Chưa có dữ liệu xuất kho</td></tr>}
                </tbody>
              </table>
            </div>
          </div>

          <div className="bg-white border rounded-2xl p-4 shadow-sm">
            <h3 className="font-semibold text-sm mb-3">Top 10 linh kiện nhập nhiều nhất</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 text-slate-500">
                  <tr>
                    <th className="px-3 py-2 text-left">#</th>
                    <th className="px-3 py-2 text-left">Linh kiện</th>
                    <th className="px-3 py-2 text-left">Hãng</th>
                    <th className="px-3 py-2 text-right">SL nhập</th>
                    <th className="px-3 py-2 text-right">Giá nhập TB</th>
                    <th className="px-3 py-2 text-right">Giá bán</th>
                    <th className="px-3 py-2 text-right">Tổng chi phí nhập</th>
                    <th className="px-3 py-2 text-right">Tồn hiện tại</th>
                  </tr>
                </thead>
                <tbody>
                  {data.topImportParts.map((p, i) => {
                    const marginPct = p.avgImportPrice > 0 ? ((p.sellPrice - p.avgImportPrice) / p.avgImportPrice) * 100 : 0;
                    return (
                      <tr key={p.partId} className="border-t border-slate-100 hover:bg-slate-50/60">
                        <td className="px-3 py-2 text-slate-400 font-mono">{i + 1}</td>
                        <td className="px-3 py-2 font-medium">{p.partName}</td>
                        <td className="px-3 py-2 text-slate-500">{p.brand || '—'}</td>
                        <td className="px-3 py-2 text-right font-semibold">{fmtNum(p.totalImportQty)}</td>
                        <td className="px-3 py-2 text-right">{fmt(p.avgImportPrice)}</td>
                        <td className="px-3 py-2 text-right">
                          {fmt(p.sellPrice)}
                          <span className={`ml-1 text-xs ${marginPct >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>({marginPct >= 0 ? '+' : ''}{marginPct.toFixed(1)}%)</span>
                        </td>
                        <td className="px-3 py-2 text-right text-amber-700 font-semibold">{fmt(p.totalImportCost)}</td>
                        <td className={`px-3 py-2 text-right font-semibold ${p.currentStock <= 0 ? 'text-rose-600' : p.currentStock <= 5 ? 'text-amber-600' : 'text-slate-700'}`}>{fmtNum(p.currentStock)}</td>
                      </tr>
                    );
                  })}
                  {data.topImportParts.length === 0 && <tr><td colSpan={8} className="px-3 py-4 text-center text-slate-400 text-sm">Chưa có dữ liệu nhập kho</td></tr>}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default InventoryKPI;
