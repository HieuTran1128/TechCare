import React, { useEffect, useState } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api';

const CATEGORY_LABEL: Record<string, string> = {
  SERVICE_QUALITY: 'Chất lượng dịch vụ',
  PRICE: 'Giá cả',
  TECHNICIAN: 'Thái độ KTV',
  TURNAROUND_TIME: 'Thời gian xử lý',
  OTHER: 'Khác',
};

const STATUS_LABEL: Record<string, { label: string; cls: string }> = {
  OPEN: { label: 'Mới', cls: 'bg-rose-100 text-rose-700' },
  IN_PROGRESS: { label: 'Đang xử lý', cls: 'bg-amber-100 text-amber-700' },
  CLOSED: { label: 'Đã đóng', cls: 'bg-emerald-100 text-emerald-700' },
  REJECTED: { label: 'Từ chối', cls: 'bg-slate-100 text-slate-600' },
};

const TICKET_STATUS_LABEL: Record<string, string> = {
  RECEIVED: 'Tiếp nhận', DIAGNOSING: 'Đang chẩn đoán', QUOTED: 'Đã báo giá',
  CUSTOMER_APPROVED: 'KH đồng ý', IN_PROGRESS: 'Đang sửa', COMPLETED: 'Hoàn thành',
  PAYMENTED: 'Đã thanh toán', WARRANTY_DONE: 'Bảo hành xong',
};

const COMPENSATION_OPTIONS = [
  { value: 'NONE', label: 'Không bồi thường' },
  { value: 'REFUND', label: 'Hoàn tiền' },
  { value: 'DISCOUNT', label: 'Giảm giá lần sau' },
  { value: 'REDO', label: 'Sửa lại miễn phí' },
];

interface TicketDetail {
  ticketCode: string;
  status: string;
  finalCost?: number;
  initialIssue?: string;
  completedAt?: string;
  createdAt?: string;
  technician?: { fullName: string; role: string };
  createdBy?: { fullName: string; role: string };
  managerAssignedBy?: { fullName: string; role: string };
  device?: { brand?: string; model?: string; deviceType?: string; customer?: { fullName: string; phone: string; email: string; address?: string } };
  repairParts?: { part?: { partName: string; brand?: string; price: number; warrantyMonths?: number }; quantity: number; unitPrice?: number }[];
  quote?: { diagnosisResult?: string; workDescription?: string; laborCost?: number; estimatedCost?: number };
  statusHistory?: { status: string; changedBy?: { fullName: string; role: string }; changedAt: string; note?: string }[];
}

interface Complaint {
  _id: string;
  complaintCode: string;
  category: string | string[];
  description: string;
  status: string;
  resolution?: string;
  compensationType?: string;
  compensationAmount?: number;
  createdAt: string;
  resolvedAt?: string;
  ticket?: TicketDetail;
  customer?: { fullName: string; phone: string; email: string; address?: string };
  assignedTo?: { fullName: string };
}

const InfoRow = ({ label, value, mono }: { label: string; value?: React.ReactNode; mono?: boolean }) => (
  <div className="flex justify-between items-start gap-2 py-1.5 border-b border-slate-100 last:border-0">
    <span className="text-xs text-slate-500 shrink-0 w-36">{label}</span>
    <span className={`text-xs font-medium text-slate-800 text-right ${mono ? 'font-mono' : ''}`}>{value || '—'}</span>
  </div>
);

export const ComplaintManagement: React.FC = () => {
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [stats, setStats] = useState({ open: 0, inProgress: 0, closed: 0, total: 0 });
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('');
  const [selected, setSelected] = useState<Complaint | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [resolution, setResolution] = useState('');
  const [compensationType, setCompensationType] = useState('NONE');
  const [compensationAmount, setCompensationAmount] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const pageSize = 15;

  const load = async () => {
    const [listRes, statsRes] = await Promise.all([
      axios.get(`${API_BASE}/complaints`, { withCredentials: true, params: { status: statusFilter || undefined, page, limit: pageSize } }),
      axios.get(`${API_BASE}/complaints/stats`, { withCredentials: true }),
    ]);
    setComplaints(listRes.data.complaints || []);
    setTotal(listRes.data.total || 0);
    setStats(statsRes.data);
  };

  useEffect(() => { load().catch(() => {}); }, [statusFilter, page]);

  const openDetail = async (c: Complaint) => {
    setDetailLoading(true);
    setSelected(c);
    setResolution(c.resolution || '');
    setCompensationType(c.compensationType || 'NONE');
    setCompensationAmount(String(c.compensationAmount || ''));
    try {
      const res = await axios.get(`${API_BASE}/complaints/${c._id}`, { withCredentials: true });
      setSelected(res.data);
      setResolution(res.data.resolution || '');
      setCompensationType(res.data.compensationType || 'NONE');
      setCompensationAmount(String(res.data.compensationAmount || ''));
    } catch { /* dùng data cũ */ }
    finally { setDetailLoading(false); }
  };

  const handleResolve = async () => {
    if (!selected) return;
    if (!resolution.trim()) { toast.error('Vui lòng nhập nội dung phản hồi.'); return; }
    setSubmitting(true);
    try {
      await axios.patch(`${API_BASE}/complaints/${selected._id}/resolve`, {
        resolution, compensationType, compensationAmount: Number(compensationAmount) || 0,
      }, { withCredentials: true });
      toast.success('Đã gửi phản hồi cho khách hàng.');
      setSelected(null);
      load();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Có lỗi xảy ra.');
    } finally { setSubmitting(false); }
  };

  const catLabels = (cat: string | string[]) => {
    const arr = Array.isArray(cat) ? cat : [cat];
    return arr.map((c) => CATEGORY_LABEL[c] || c).join(', ');
  };

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <div className="space-y-5">
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'Tổng khiếu nại', value: stats.total, color: 'text-slate-700', bg: 'bg-white' },
          { label: 'Mới / Chưa xử lý', value: stats.open, color: 'text-rose-600', bg: 'bg-rose-50' },
          { label: 'Đang xử lý', value: stats.inProgress, color: 'text-amber-600', bg: 'bg-amber-50' },
          { label: 'Đã đóng', value: stats.closed, color: 'text-emerald-600', bg: 'bg-emerald-50' },
        ].map((s) => (
          <div key={s.label} className={`${s.bg} border rounded-xl p-4`}>
            <p className="text-xs text-slate-500 mb-1">{s.label}</p>
            <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Filter */}
      <div className="flex flex-wrap gap-2">
        {[{ v: '', l: 'Tất cả' }, { v: 'OPEN', l: 'Mới' }, { v: 'IN_PROGRESS', l: 'Đang xử lý' }, { v: 'CLOSED', l: 'Đã đóng' }].map((f) => (
          <button key={f.v} onClick={() => { setStatusFilter(f.v); setPage(1); }}
            className={`px-4 py-1.5 rounded-lg text-sm ${statusFilter === f.v ? 'bg-blue-600 text-white' : 'bg-white border'}`}>
            {f.l}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white border rounded-2xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-slate-500 text-xs">
              <tr>
                <th className="px-4 py-3 text-left">Mã phiếu</th>
                <th className="px-4 py-3 text-left">Khách hàng</th>
                <th className="px-4 py-3 text-left">KTV sửa chữa</th>
                <th className="px-4 py-3 text-left">Loại khiếu nại</th>
                <th className="px-4 py-3 text-left">Nội dung</th>
                <th className="px-4 py-3 text-left">Trạng thái</th>
                <th className="px-4 py-3 text-left">Ngày gửi</th>
                <th className="px-4 py-3 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {complaints.map((c) => {
                const st = STATUS_LABEL[c.status] || { label: c.status, cls: 'bg-slate-100 text-slate-600' };
                return (
                  <tr key={c._id} className="border-t border-slate-100 hover:bg-slate-50/50">
                    <td className="px-4 py-3 font-mono text-xs font-semibold text-blue-700">{c.complaintCode}</td>
                    <td className="px-4 py-3">
                      <p className="font-medium text-slate-800">{c.customer?.fullName || 'N/A'}</p>
                      <p className="text-xs text-slate-400">{c.customer?.phone || ''}</p>
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-600">
                      {(c.ticket as any)?.technician?.fullName || <span className="text-slate-300">—</span>}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1">
                        {(Array.isArray(c.category) ? c.category : [c.category]).map((cat) => (
                          <span key={cat} className="px-1.5 py-0.5 bg-rose-50 text-rose-600 rounded text-xs">{CATEGORY_LABEL[cat] || cat}</span>
                        ))}
                      </div>
                    </td>
                    <td className="px-4 py-3 max-w-xs">
                      <p className="text-slate-700 line-clamp-2 text-xs">{c.description}</p>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${st.cls}`}>{st.label}</span>
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-500">{new Date(c.createdAt).toLocaleDateString('vi-VN')}</td>
                    <td className="px-4 py-3 text-right">
                      <button onClick={() => openDetail(c)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold ${c.status === 'CLOSED' ? 'bg-slate-100 text-slate-500' : 'bg-violet-600 text-white'}`}>
                        {c.status === 'CLOSED' ? 'Xem' : 'Xử lý'}
                      </button>
                    </td>
                  </tr>
                );
              })}
              {complaints.length === 0 && (
                <tr><td colSpan={8} className="px-4 py-8 text-center text-slate-400 text-sm">Không có khiếu nại nào.</td></tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="flex items-center justify-between px-4 py-3 border-t border-slate-100">
          <p className="text-xs text-slate-500">Trang {page} / {totalPages} · {total} khiếu nại</p>
          <div className="flex gap-1.5">
            <button onClick={() => setPage(1)} disabled={page === 1} className="px-2 py-1 rounded border text-xs disabled:opacity-40">«</button>
            <button onClick={() => setPage(p => p - 1)} disabled={page === 1} className="px-2 py-1 rounded border text-xs disabled:opacity-40">‹</button>
            <button onClick={() => setPage(p => p + 1)} disabled={page === totalPages} className="px-2 py-1 rounded border text-xs disabled:opacity-40">›</button>
            <button onClick={() => setPage(totalPages)} disabled={page === totalPages} className="px-2 py-1 rounded border text-xs disabled:opacity-40">»</button>
          </div>
        </div>
      </div>

      {/* Modal chi tiết + xử lý */}
      {selected && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[92vh] overflow-y-auto">
            {/* Header */}
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between sticky top-0 bg-white z-10">
              <div>
                <h3 className="font-semibold text-slate-900">Chi tiết khiếu nại</h3>
                <p className="text-xs font-mono text-blue-600 mt-0.5">{selected.complaintCode}</p>
              </div>
              <div className="flex items-center gap-2">
                {selected.status && (
                  <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${STATUS_LABEL[selected.status]?.cls || ''}`}>
                    {STATUS_LABEL[selected.status]?.label || selected.status}
                  </span>
                )}
                <button onClick={() => setSelected(null)} className="text-slate-400 hover:text-slate-600 text-xl leading-none">×</button>
              </div>
            </div>

            {detailLoading ? (
              <div className="p-8 text-center text-slate-400 text-sm">Đang tải...</div>
            ) : (
              <div className="p-6 space-y-5">

                {/* Loại khiếu nại */}
                <div className="flex flex-wrap gap-1.5">
                  {(Array.isArray(selected.category) ? selected.category : [selected.category]).map((cat) => (
                    <span key={cat} className="px-3 py-1 bg-rose-100 text-rose-700 rounded-full text-xs font-semibold">{CATEGORY_LABEL[cat] || cat}</span>
                  ))}
                </div>

                {/* Nội dung khiếu nại */}
                <div className="bg-rose-50 border border-rose-100 rounded-xl p-4">
                  <p className="text-xs font-semibold text-rose-600 mb-2">Nội dung khiếu nại từ khách</p>
                  <p className="text-sm text-slate-700 leading-relaxed">{selected.description}</p>
                  <p className="text-xs text-slate-400 mt-2">Gửi lúc: {new Date(selected.createdAt).toLocaleString('vi-VN')}</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Thông tin khách hàng */}
                  <div className="bg-slate-50 rounded-xl p-4">
                    <p className="text-xs font-bold text-slate-600 uppercase tracking-wide mb-3">👤 Khách hàng</p>
                    <InfoRow label="Họ tên" value={selected.customer?.fullName} />
                    <InfoRow label="Số điện thoại" value={selected.customer?.phone} />
                    <InfoRow label="Email" value={selected.customer?.email} />
                    {selected.customer?.address && <InfoRow label="Địa chỉ" value={selected.customer.address} />}
                  </div>

                  {/* Thông tin thiết bị */}
                  <div className="bg-slate-50 rounded-xl p-4">
                    <p className="text-xs font-bold text-slate-600 uppercase tracking-wide mb-3">📱 Thiết bị</p>
                    <InfoRow label="Loại" value={selected.ticket?.device?.deviceType} />
                    <InfoRow label="Hãng / Model" value={`${selected.ticket?.device?.brand || ''} ${selected.ticket?.device?.model || ''}`.trim()} />
                    <InfoRow label="Vấn đề ban đầu" value={selected.ticket?.initialIssue} />
                  </div>
                </div>

                {/* Thông tin phiếu sửa chữa */}
                <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
                  <p className="text-xs font-bold text-blue-700 uppercase tracking-wide mb-3">🔧 Phiếu sửa chữa</p>
                  <div className="grid grid-cols-2 gap-x-4">
                    <InfoRow label="Mã phiếu" value={<span className="font-mono text-blue-700">{selected.ticket?.ticketCode}</span>} />
                    <InfoRow label="Trạng thái" value={TICKET_STATUS_LABEL[selected.ticket?.status || ''] || selected.ticket?.status} />
                    <InfoRow label="Ngày tiếp nhận" value={selected.ticket?.createdAt ? new Date(selected.ticket.createdAt).toLocaleDateString('vi-VN') : undefined} />
                    <InfoRow label="Ngày hoàn thành" value={selected.ticket?.completedAt ? new Date(selected.ticket.completedAt).toLocaleDateString('vi-VN') : undefined} />
                    <InfoRow label="Chi phí cuối" value={selected.ticket?.finalCost ? selected.ticket.finalCost.toLocaleString('vi-VN') + ' ₫' : undefined} />
                  </div>
                </div>

                {/* Nhân sự liên quan */}
                <div className="bg-violet-50 border border-violet-100 rounded-xl p-4">
                  <p className="text-xs font-bold text-violet-700 uppercase tracking-wide mb-3">👥 Nhân sự liên quan</p>
                  <div className="grid grid-cols-1 gap-0">
                    <InfoRow label="Lễ tân tiếp nhận" value={selected.ticket?.createdBy?.fullName
                      ? <span>{selected.ticket.createdBy.fullName} <span className="text-slate-400">({selected.ticket.createdBy.role})</span></span>
                      : undefined} />
                    <InfoRow label="Manager phân công" value={selected.ticket?.managerAssignedBy?.fullName
                      ? <span>{selected.ticket.managerAssignedBy.fullName}</span>
                      : undefined} />
                    <InfoRow label="Kỹ thuật viên" value={selected.ticket?.technician?.fullName
                      ? <span className="font-semibold text-violet-700">{selected.ticket.technician.fullName}</span>
                      : <span className="text-slate-400">Chưa phân công</span>} />
                  </div>
                </div>

                {/* Chẩn đoán & báo giá */}
                {selected.ticket?.quote?.diagnosisResult && (
                  <div className="bg-amber-50 border border-amber-100 rounded-xl p-4">
                    <p className="text-xs font-bold text-amber-700 uppercase tracking-wide mb-3">📋 Chẩn đoán & Báo giá</p>
                    <InfoRow label="Kết quả chẩn đoán" value={selected.ticket.quote.diagnosisResult} />
                    {selected.ticket.quote.workDescription && <InfoRow label="Hạng mục sửa" value={selected.ticket.quote.workDescription} />}
                    {selected.ticket.quote.laborCost !== undefined && <InfoRow label="Tiền công" value={selected.ticket.quote.laborCost.toLocaleString('vi-VN') + ' ₫'} />}
                  </div>
                )}

                {/* Linh kiện đã dùng */}
                {selected.ticket?.repairParts && selected.ticket.repairParts.length > 0 && (
                  <div className="bg-white border rounded-xl overflow-hidden">
                    <p className="text-xs font-bold text-slate-600 uppercase tracking-wide px-4 py-3 border-b bg-slate-50">🔩 Linh kiện đã sử dụng</p>
                    <table className="w-full text-xs">
                      <thead className="bg-slate-50 text-slate-500">
                        <tr>
                          <th className="px-3 py-2 text-left">Linh kiện</th>
                          <th className="px-3 py-2 text-center">SL</th>
                          <th className="px-3 py-2 text-right">Đơn giá</th>
                          <th className="px-3 py-2 text-center">Bảo hành</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selected.ticket.repairParts.map((p, i) => (
                          <tr key={i} className="border-t border-slate-100">
                            <td className="px-3 py-2 font-medium">{p.part?.partName || 'N/A'}{p.part?.brand ? ` (${p.part.brand})` : ''}</td>
                            <td className="px-3 py-2 text-center">{p.quantity}</td>
                            <td className="px-3 py-2 text-right">{(p.unitPrice || p.part?.price || 0).toLocaleString('vi-VN')} ₫</td>
                            <td className="px-3 py-2 text-center">{p.part?.warrantyMonths ? `${p.part.warrantyMonths} tháng` : '—'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {/* Lịch sử trạng thái */}
                {selected.ticket?.statusHistory && selected.ticket.statusHistory.length > 0 && (
                  <div className="bg-white border rounded-xl p-4">
                    <p className="text-xs font-bold text-slate-600 uppercase tracking-wide mb-3">📅 Lịch sử xử lý phiếu</p>
                    <div className="space-y-2 max-h-40 overflow-y-auto">
                      {[...selected.ticket.statusHistory].reverse().map((h, i) => (
                        <div key={i} className="flex items-start gap-3 text-xs">
                          <div className="w-1.5 h-1.5 rounded-full bg-slate-400 mt-1.5 shrink-0" />
                          <div>
                            <span className="font-semibold text-slate-700">{TICKET_STATUS_LABEL[h.status] || h.status}</span>
                            {h.changedBy && <span className="text-slate-400"> · {h.changedBy.fullName}</span>}
                            <span className="text-slate-400"> · {new Date(h.changedAt).toLocaleString('vi-VN')}</span>
                            {h.note && <p className="text-slate-500 mt-0.5">{h.note}</p>}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Xử lý / Kết quả */}
                {selected.status !== 'CLOSED' ? (
                  <div className="border-t border-slate-100 pt-4 space-y-4">
                    <p className="text-sm font-bold text-slate-800">Phản hồi & Xử lý</p>

                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-slate-600">Nội dung phản hồi cho khách *</label>
                      <textarea
                        value={resolution}
                        onChange={(e) => setResolution(e.target.value)}
                        rows={4}
                        className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm resize-none focus:outline-none focus:border-violet-400"
                        placeholder="Mô tả kết quả điều tra, cách xử lý, lời xin lỗi (nếu có)..."
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-slate-600">Hình thức bồi thường</label>
                        <select value={compensationType} onChange={(e) => setCompensationType(e.target.value)}
                          className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm">
                          {COMPENSATION_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                        </select>
                      </div>
                      {(compensationType === 'REFUND' || compensationType === 'DISCOUNT') && (
                        <div className="space-y-1.5">
                          <label className="text-xs font-semibold text-slate-600">Số tiền (₫)</label>
                          <input type="number" min="0" value={compensationAmount}
                            onChange={(e) => setCompensationAmount(e.target.value)}
                            className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm" placeholder="0" />
                        </div>
                      )}
                    </div>

                    <div className="flex gap-2">
                      <button onClick={handleResolve} disabled={submitting}
                        className="flex-1 py-2.5 rounded-xl bg-violet-600 text-white font-semibold text-sm disabled:opacity-60">
                        {submitting ? 'Đang gửi...' : '📧 Gửi phản hồi cho khách'}
                      </button>
                      <button onClick={() => setSelected(null)} className="px-6 py-2.5 rounded-xl border text-sm">Đóng</button>
                    </div>
                  </div>
                ) : (
                  <div className="border-t border-slate-100 pt-4">
                    <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 space-y-2">
                      <p className="text-xs font-bold text-emerald-700">✅ Đã xử lý · {selected.resolvedAt ? new Date(selected.resolvedAt).toLocaleString('vi-VN') : ''}</p>
                      <p className="text-sm text-slate-700 leading-relaxed">{selected.resolution}</p>
                      {selected.compensationType && selected.compensationType !== 'NONE' && (
                        <p className="text-xs text-slate-500 font-medium">
                          Bồi thường: {COMPENSATION_OPTIONS.find(o => o.value === selected.compensationType)?.label}
                          {selected.compensationAmount ? ` — ${Number(selected.compensationAmount).toLocaleString('vi-VN')} ₫` : ''}
                        </p>
                      )}
                    </div>
                    <button onClick={() => setSelected(null)} className="mt-3 w-full py-2.5 rounded-xl border text-sm">Đóng</button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
