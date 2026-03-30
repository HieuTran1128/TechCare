import React, { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { BadgeCheck, CircleSlash, DollarSign, PackageCheck } from 'lucide-react';
import { useTickets } from '../hooks';
import { ticketService } from '../services';
import { TICKET_STATUS_LABELS } from '../constants';
import { StatusBadge, Pagination } from '../components/ui';

interface Summary {
  totalTickets: number;
  completedTickets: number;
  rejectedTickets: number;
  totalRevenue: number;
}

export const AdminDashboard: React.FC = () => {
  const { tickets } = useTickets({ limit: 1000, sort: '-createdAt' });
  const [summary, setSummary] = useState<Summary>({ totalTickets: 0, completedTickets: 0, rejectedTickets: 0, totalRevenue: 0 });
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(8);

  useEffect(() => {
    ticketService.getSummary().then(setSummary).catch(() => undefined);
  }, []);

  const completionRate = useMemo(() => {
    if (!summary.totalTickets) return 0;
    return (summary.completedTickets / summary.totalTickets) * 100;
  }, [summary]);

  const statusOptions = useMemo(() => ['ALL', ...Array.from(new Set(tickets.map((t) => t.status).filter(Boolean)))], [tickets]);
  const filteredTickets = useMemo(() => statusFilter === 'ALL' ? tickets : tickets.filter((t) => t.status === statusFilter), [tickets, statusFilter]);
  const totalPages = Math.max(1, Math.ceil(filteredTickets.length / pageSize));
  const pagedTickets = useMemo(() => filteredTickets.slice((page - 1) * pageSize, page * pageSize), [filteredTickets, page, pageSize]);

  useEffect(() => { setPage(1); }, [statusFilter, pageSize]);
  useEffect(() => { if (page > totalPages) setPage(totalPages); }, [page, totalPages]);

  const stats = [
    { label: 'Doanh thu', value: `${summary.totalRevenue.toLocaleString('vi-VN')} ₫`, hint: 'Tổng giá trị phiếu đã hoàn thành', icon: DollarSign, accent: 'from-emerald-500 to-teal-500' },
    { label: 'Tổng đơn hàng', value: summary.totalTickets, hint: 'Tất cả ticket trong hệ thống', icon: PackageCheck, accent: 'from-indigo-500 to-violet-500' },
    { label: 'Tỷ lệ hoàn thành', value: `${completionRate.toFixed(1)}%`, hint: `${summary.completedTickets}/${summary.totalTickets} ticket`, icon: BadgeCheck, accent: 'from-sky-500 to-blue-500' },
    { label: 'Đơn bị từ chối', value: summary.rejectedTickets, hint: 'Cần theo dõi nguyên nhân từ chối', icon: CircleSlash, accent: 'from-rose-500 to-orange-500' },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        {stats.map((s, idx) => {
          const Icon = s.icon;
          return (
            <motion.div key={s.label} initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.05 }} className="relative overflow-hidden rounded-2xl border bg-white/90 p-4 shadow-sm">
              <div className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${s.accent}`} />
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs uppercase tracking-[0.15em] text-slate-500">{s.label}</p>
                  <p className="text-2xl font-extrabold mt-2 text-slate-900">{s.value}</p>
                  <p className="text-xs text-slate-500 mt-1">{s.hint}</p>
                </div>
                <div className={`h-10 w-10 rounded-xl bg-gradient-to-br ${s.accent} text-white grid place-items-center shadow`}>
                  <Icon size={18} />
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      <section className="rounded-2xl border bg-white/90 p-5 shadow-sm">
        <div className="mb-4 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <h2 className="font-bold text-slate-900">Đơn hàng gần đây</h2>
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs text-slate-500">Tổng {filteredTickets.length} đơn</span>
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="border rounded-lg px-2.5 py-1.5 text-xs bg-white">
              {statusOptions.map((status) => (
                <option key={status} value={status}>{status === 'ALL' ? 'Tất cả trạng thái' : (TICKET_STATUS_LABELS[status as keyof typeof TICKET_STATUS_LABELS] || status)}</option>
              ))}
            </select>
            <select value={pageSize} onChange={(e) => setPageSize(Number(e.target.value))} className="border rounded-lg px-2.5 py-1.5 text-xs bg-white">
              <option value={10}>10 / trang</option>
              <option value={20}>20 / trang</option>
              <option value={30}>30 / trang</option>
            </select>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-slate-500 border-b">
                <th className="py-2.5">Mã phiếu</th>
                <th>Khách hàng</th>
                <th>Thiết bị</th>
                <th>Trạng thái</th>
                <th>Chi phí cuối</th>
              </tr>
            </thead>
            <tbody>
              {pagedTickets.map((t) => (
                <tr key={t._id} className="border-b border-slate-100 last:border-b-0">
                  <td className="py-2.5 font-semibold text-slate-800">{t.ticketCode}</td>
                  <td>{t.device?.customer?.fullName || '-'}</td>
                  <td>{(t.device as any)?.deviceType || '-'} • {t.device?.brand || '-'} • {t.device?.model || '-'}</td>
                  <td><StatusBadge status={t.status} /></td>
                  <td className="font-semibold">{(t.finalCost || 0).toLocaleString('vi-VN')} ₫</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="mt-3 flex justify-end">
          <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />
        </div>
      </section>
    </div>
  );
};
