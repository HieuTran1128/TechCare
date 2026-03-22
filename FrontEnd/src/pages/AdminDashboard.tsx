import React, { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { motion } from 'framer-motion';
import { BadgeCheck, CircleSlash, DollarSign, PackageCheck } from 'lucide-react';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api';

interface Summary {
  totalTickets: number;
  completedTickets: number;
  rejectedTickets: number;
  totalRevenue: number;
}

interface Ticket {
  _id: string;
  ticketCode: string;
  status: string;
  finalCost?: number;
  createdAt?: string;
  device?: {
    brand?: string;
    model?: string;
    customer?: { fullName?: string };
  };
}

const statusLabels: Record<string, string> = {
  COMPLETED: 'Hoàn thành',
  PAYMENTED: 'Đã thanh toán',
  REJECTED: 'Từ chối',
  PENDING: 'Đang chờ',
  IN_PROGRESS: 'Đang xử lý',
  CANCELLED: 'Đã hủy',
  DIAGNOSING: 'Kỹ thuật kiểm tra',
  WAITING_INVENTORY: 'Chờ kho duyệt',
  INVENTORY_APPROVED: 'Kho đã duyệt',
  INVENTORY_REJECTED: 'Kho từ chối',
  QUOTED: 'Đã gửi báo giá',
  CUSTOMER_APPROVED: 'Khách đồng ý',
  CUSTOMER_REJECTED: 'Khách từ chối',
  RECEIVED: 'Tiếp nhận',
  MANAGER_ASSIGNED: 'Quản lý phân công',
  DONE_INVENTORY_REJECTED: 'Kho từ chối',
};

const statusColorClasses: Record<string, string> = {
  RECEIVED: 'bg-blue-100 text-blue-700',
  MANAGER_ASSIGNED: 'bg-indigo-100 text-indigo-700',
  DIAGNOSING: 'bg-violet-100 text-violet-700',
  WAITING_INVENTORY: 'bg-amber-100 text-amber-700',
  INVENTORY_APPROVED: 'bg-emerald-100 text-emerald-700',
  INVENTORY_REJECTED: 'bg-rose-100 text-rose-700',
  QUOTED: 'bg-cyan-100 text-cyan-700',
  CUSTOMER_APPROVED: 'bg-teal-100 text-teal-700',
  CUSTOMER_REJECTED: 'bg-red-100 text-red-700',
  IN_PROGRESS: 'bg-purple-100 text-purple-700',
  COMPLETED: 'bg-green-100 text-green-700',
  PAYMENTED: 'bg-emerald-200 text-emerald-800',
  REJECTED: 'bg-red-100 text-red-700',
  CANCELLED: 'bg-slate-200 text-slate-700',
  PENDING: 'bg-yellow-100 text-yellow-700',
  DONE_INVENTORY_REJECTED: 'bg-red-100 text-red-700',
};

export const AdminDashboard: React.FC = () => {
  const [summary, setSummary] = useState<Summary>({
    totalTickets: 0,
    completedTickets: 0,
    rejectedTickets: 0,
    totalRevenue: 0,
  });
  const [latest, setLatest] = useState<Ticket[]>([]);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(8);

  useEffect(() => {
    const load = async () => {
      const [s, t] = await Promise.all([
        axios.get(`${API_BASE}/ticket/manager/summary`, { withCredentials: true }),
        axios.get(`${API_BASE}/ticket?limit=1000&sort=-createdAt`, { withCredentials: true }),
      ]);
      setSummary(s.data);
      setLatest(t.data.data || []);
    };

    load().catch(() => undefined);
  }, []);

  const completionRate = useMemo(() => {
    if (!summary.totalTickets) return 0;
    return (summary.completedTickets / summary.totalTickets) * 100;
  }, [summary]);

  const statusOptions = useMemo(() => {
    const set = new Set(latest.map((t) => t.status).filter(Boolean));
    return ['ALL', ...Array.from(set)];
  }, [latest]);

  const filteredLatest = useMemo(() => {
    if (statusFilter === 'ALL') return latest;
    return latest.filter((t) => t.status === statusFilter);
  }, [latest, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredLatest.length / pageSize));

  const pagedLatest = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredLatest.slice(start, start + pageSize);
  }, [filteredLatest, page, pageSize]);

  useEffect(() => {
    setPage(1);
  }, [statusFilter, pageSize]);

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  const stats = [
    {
      label: 'Doanh thu',
      value: `${summary.totalRevenue.toLocaleString('vi-VN')} ₫`,
      hint: 'Tổng giá trị phiếu đã hoàn thành',
      icon: DollarSign,
      accent: 'from-emerald-500 to-teal-500',
    },
    {
      label: 'Tổng đơn hàng',
      value: summary.totalTickets,
      hint: 'Tất cả ticket trong hệ thống',
      icon: PackageCheck,
      accent: 'from-indigo-500 to-violet-500',
    },
    {
      label: 'Tỷ lệ hoàn thành',
      value: `${completionRate.toFixed(1)}%`,
      hint: `${summary.completedTickets}/${summary.totalTickets} ticket`,
      icon: BadgeCheck,
      accent: 'from-sky-500 to-blue-500',
    },
    {
      label: 'Đơn bị từ chối',
      value: summary.rejectedTickets,
      hint: 'Cần theo dõi nguyên nhân từ chối',
      icon: CircleSlash,
      accent: 'from-rose-500 to-orange-500',
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-3">
        <div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        {stats.map((s, idx) => {
          const Icon = s.icon;
          return (
            <motion.div
              key={s.label}
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
              className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white/90 p-4 shadow-[0_8px_30px_rgba(2,6,23,.06)]"
            >
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

      <section className="rounded-2xl border border-slate-200 bg-white/90 p-5 shadow-[0_10px_28px_rgba(2,6,23,.06)]">
        <div className="mb-4 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <h2 className="font-bold text-slate-900">Đơn hàng gần đây</h2>
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs text-slate-500">Tổng {filteredLatest.length} đơn</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs bg-white"
            >
              {statusOptions.map((status) => (
                <option key={status} value={status}>
                  {status === 'ALL' ? 'Tất cả trạng thái' : (statusLabels[status] || status)}
                </option>
              ))}
            </select>
            <select
              value={pageSize}
              onChange={(e) => setPageSize(Number(e.target.value))}
              className="border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs bg-white"
            >
              <option value={5}>5 / trang</option>
              <option value={10}>10 / trang</option>
              <option value={20}>20 / trang</option>
            </select>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-slate-500 border-b border-slate-200">
                <th className="py-2.5">Mã phiếu</th>
                <th>Khách hàng</th>
                <th>Thiết bị</th>
                <th>Trạng thái</th>
                <th>Chi phí cuối</th>
              </tr>
            </thead>
            <tbody>
              {pagedLatest.map((t) => (
                <tr key={t._id} className="border-b border-slate-100 last:border-b-0">
                  <td className="py-2.5 font-semibold text-slate-800">{t.ticketCode}</td>
                  <td>{t.device?.customer?.fullName || '-'}</td>
                  <td>{t.device?.deviceType || '-'} • {t.device?.brand || '-'} • {t.device?.model || '-'}</td>
                  <td>
                    <span className={`inline-flex px-2 py-1 rounded-full text-xs font-semibold ${statusColorClasses[t.status] || 'bg-slate-100 text-slate-700'}`}>
                      {statusLabels[t.status] || t.status}
                    </span>
                  </td>
                  <td className="font-semibold">{(t.finalCost || 0).toLocaleString('vi-VN')} ₫</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-3 flex items-center justify-end gap-2">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page <= 1}
            className="px-2.5 py-1.5 text-xs rounded-md border border-slate-300 disabled:opacity-40"
          >
            Trước
          </button>
          <span className="text-xs text-slate-500">Trang {page}/{totalPages}</span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page >= totalPages}
            className="px-2.5 py-1.5 text-xs rounded-md border border-slate-300 disabled:opacity-40"
          >
            Sau
          </button>
        </div>
      </section>
    </div>
  );
};