import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { motion } from 'framer-motion';
import { AlertTriangle, CheckCircle2, Clock, MessageSquare } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api';

const CATEGORY_LABELS: Record<string, string> = {
  SERVICE: 'Dịch vụ', QUALITY: 'Chất lượng', PRICE: 'Giá cả',
  ATTITUDE: 'Thái độ NV', OTHER: 'Khác',
};

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  OPEN: { label: 'Chờ xử lý', color: 'bg-rose-100 text-rose-700' },
  IN_PROGRESS: { label: 'Đang xử lý', color: 'bg-amber-100 text-amber-700' },
  RESOLVED: { label: 'Đã giải quyết', color: 'bg-emerald-100 text-emerald-700' },
};

interface Complaint {
  _id: string;
  ticketCode: string;
  customerName: string;
  customerEmail: string;
  category: string;
  content: string;
  status: string;
  resolution?: string;
  resolvedBy?: { fullName: string };
  resolvedAt?: string;
  createdAt: string;
}

export const ComplaintManagement: React.FC = () => {
  const { user } = useAuth();
  const isManager = user?.role === 'manager';

  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [total, setTotal] = useState(0);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [page, setPage] = useState(1);
  const pageSize = 10;
  const [loading, setLoading] = useState(false);

  const [resolveModal, setResolveModal] = useState<Complaint | null>(null);
  const [resolution, setResolution] = useState('');
  const [resolveLoading, setResolveLoading] = useState(false);
  const [feedback, setFeedback] = useState('');

  const load = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${API_BASE}/complaints`, {
        withCredentials: true,
        params: { status: statusFilter, page, limit: pageSize },
      });
      setComplaints(res.data.data || []);
      setTotal(res.data.total || 0);
    } catch {
      setComplaints([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [statusFilter, page]);

  const markInProgress = async (id: string) => {
    await axios.patch(`${API_BASE}/complaints/${id}/status`, { status: 'IN_PROGRESS' }, { withCredentials: true });
    load();
  };

  const submitResolve = async () => {
    if (!resolveModal || !resolution.trim()) return;
    try {
      setResolveLoading(true);
      await axios.patch(`${API_BASE}/complaints/${resolveModal._id}/resolve`, { resolution }, { withCredentials: true });
      setFeedback('Đã xử lý và gửi mail phản hồi cho khách.');
      setResolveModal(null);
      setResolution('');
      load();
      setTimeout(() => setFeedback(''), 3000);
    } catch (err: any) {
      setFeedback(err?.response?.data?.message || 'Không thể xử lý.');
    } finally {
      setResolveLoading(false);
    }
  };

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  const summaryCount = {
    OPEN: complaints.filter((c) => c.status === 'OPEN').length,
    IN_PROGRESS: complaints.filter((c) => c.status === 'IN_PROGRESS').length,
    RESOLVED: complaints.filter((c) => c.status === 'RESOLVED').length,
  };

  return (
    <div className="space-y-5">
      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Chờ xử lý', count: summaryCount.OPEN, icon: AlertTriangle, color: 'text-rose-600', bg: 'bg-rose-50' },
          { label: 'Đang xử lý', count: summaryCount.IN_PROGRESS, icon: Clock, color: 'text-amber-600', bg: 'bg-amber-50' },
          { label: 'Đã giải quyết', count: summaryCount.RESOLVED, icon: CheckCircle2, color: 'text-emerald-600', bg: 'bg-emerald-50' },
        ].map((item) => {
          const Icon = item.icon;
          return (
            <div key={item.label} className="bg-white border rounded-2xl p-4 shadow-sm flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl ${item.bg} flex items-center justify-center`}>
                <Icon size={18} className={item.color} />
              </div>
              <div>
                <p className="text-xs text-slate-500">{item.label}</p>
                <p className="text-xl font-bold">{item.count}</p>
              </div>
            </div>
          );
        })}
      </div>

      {feedback && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 px-4 py-2 rounded-xl text-sm">{feedback}</div>
      )}

      {/* Filter + table */}
      <div className="bg-white border rounded-2xl shadow-sm overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center gap-2">
            <MessageSquare size={16} className="text-slate-500" />
            <h2 className="font-semibold text-slate-900">Danh sách khiếu nại</h2>
            <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">{total} tổng</span>
          </div>
          <select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
            className="border rounded-xl px-3 py-1.5 text-sm"
          >
            <option value="ALL">Tất cả</option>
            <option value="OPEN">Chờ xử lý</option>
            <option value="IN_PROGRESS">Đang xử lý</option>
            <option value="RESOLVED">Đã giải quyết</option>
          </select>
        </div>

        {loading ? (
          <p className="text-sm text-slate-500 p-6 text-center">Đang tải...</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-slate-500">
                <tr>
                  <th className="px-4 py-3 text-left">Mã phiếu</th>
                  <th className="px-4 py-3 text-left">Khách hàng</th>
                  <th className="px-4 py-3 text-left">Loại</th>
                  <th className="px-4 py-3 text-left">Nội dung</th>
                  <th className="px-4 py-3 text-left">Trạng thái</th>
                  <th className="px-4 py-3 text-left">Thời gian</th>
                  <th className="px-4 py-3 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {complaints.map((c) => (
                  <motion.tr key={c._id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="border-t border-slate-100 hover:bg-slate-50/60">
                    <td className="px-4 py-3 font-semibold text-slate-800">{c.ticketCode}</td>
                    <td className="px-4 py-3">
                      <p className="font-medium">{c.customerName}</p>
                      <p className="text-xs text-slate-400">{c.customerEmail}</p>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs px-2 py-1 rounded-full bg-slate-100 text-slate-600 font-medium">
                        {CATEGORY_LABELS[c.category] || c.category}
                      </span>
                    </td>
                    <td className="px-4 py-3 max-w-[220px]">
                      <p className="truncate text-slate-700">{c.content}</p>
                      {c.resolution && (
                        <p className="text-xs text-emerald-600 truncate mt-0.5">↳ {c.resolution}</p>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-1 rounded-full font-semibold ${STATUS_CONFIG[c.status]?.color || 'bg-slate-100 text-slate-600'}`}>
                        {STATUS_CONFIG[c.status]?.label || c.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-500 text-xs">{new Date(c.createdAt).toLocaleString('vi-VN')}</td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex justify-end gap-2">
                        {c.status === 'OPEN' && (
                          <button onClick={() => markInProgress(c._id)} className="px-2.5 py-1 rounded-lg bg-amber-100 text-amber-700 text-xs font-semibold hover:bg-amber-200">
                            Tiếp nhận
                          </button>
                        )}
                        {isManager && c.status !== 'RESOLVED' && (
                          <button onClick={() => { setResolveModal(c); setResolution(''); }} className="px-2.5 py-1 rounded-lg bg-emerald-600 text-white text-xs font-semibold hover:bg-emerald-700">
                            Xử lý
                          </button>
                        )}
                      </div>
                    </td>
                  </motion.tr>
                ))}
                {complaints.length === 0 && (
                  <tr><td colSpan={7} className="px-4 py-8 text-center text-slate-400">Không có khiếu nại nào</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        <div className="flex items-center justify-between px-4 py-3 border-t border-slate-100">
          <p className="text-xs text-slate-500">Trang {page}/{totalPages} • {total} khiếu nại</p>
          <div className="flex gap-1">
            <button onClick={() => setPage(1)} disabled={page <= 1} className="px-2.5 py-1.5 rounded-lg border text-xs disabled:opacity-40">«</button>
            <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page <= 1} className="px-3 py-1.5 rounded-lg border text-xs disabled:opacity-40">Trước</button>
            <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page >= totalPages} className="px-3 py-1.5 rounded-lg border text-xs disabled:opacity-40">Sau</button>
            <button onClick={() => setPage(totalPages)} disabled={page >= totalPages} className="px-2.5 py-1.5 rounded-lg border text-xs disabled:opacity-40">»</button>
          </div>
        </div>
      </div>

      {/* Modal xử lý */}
      {resolveModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl w-full max-w-lg p-5 space-y-4 shadow-2xl">
            <h3 className="font-bold text-lg">Xử lý khiếu nại</h3>
            <div className="bg-slate-50 rounded-xl p-3 text-sm space-y-1">
              <p><span className="text-slate-500">Khách:</span> <strong>{resolveModal.customerName}</strong> ({resolveModal.customerEmail})</p>
              <p><span className="text-slate-500">Phiếu:</span> {resolveModal.ticketCode}</p>
              <p><span className="text-slate-500">Loại:</span> {CATEGORY_LABELS[resolveModal.category]}</p>
              <p className="text-slate-700 mt-2 border-t pt-2">{resolveModal.content}</p>
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-600 block mb-1">Kết quả xử lý & cách giải quyết *</label>
              <textarea
                rows={4}
                value={resolution}
                onChange={(e) => setResolution(e.target.value)}
                className="w-full border rounded-xl px-3 py-2.5 text-sm resize-none"
                placeholder="Mô tả cách cửa hàng đã xử lý vấn đề này..."
              />
            </div>
            <p className="text-xs text-slate-400">Nội dung này sẽ được gửi qua email đến khách hàng.</p>
            <div className="flex gap-3 justify-end">
              <button onClick={() => setResolveModal(null)} className="px-4 py-2 border rounded-xl text-sm">Hủy</button>
              <button
                onClick={submitResolve}
                disabled={resolveLoading || !resolution.trim()}
                className="px-5 py-2 bg-emerald-600 text-white rounded-xl text-sm font-semibold disabled:opacity-50"
              >
                {resolveLoading ? 'Đang gửi...' : 'Xác nhận & Gửi mail khách'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
