import React, { useState } from 'react';
import toast from 'react-hot-toast';
import { InfoRow } from '../ui';
import { COMPLAINT_CATEGORY_LABELS, COMPLAINT_STATUS_CONFIG, COMPENSATION_OPTIONS } from '../../constants';
import { TICKET_STATUS_LABELS } from '../../constants';
import { complaintService } from '../../services';
import type { Complaint, CompensationType } from '../../types';

interface ComplaintDetailModalProps {
  complaint: Complaint;
  loading?: boolean;
  onClose: () => void;
  onResolved: () => void;
}

export const ComplaintDetailModal: React.FC<ComplaintDetailModalProps> = ({
  complaint,
  loading = false,
  onClose,
  onResolved,
}) => {
  const [resolution, setResolution] = useState(complaint.resolution || '');
  const [compensationType, setCompensationType] = useState<CompensationType>(
    (complaint.compensationType as CompensationType) || 'NONE'
  );
  const [compensationAmount, setCompensationAmount] = useState(
    String(complaint.compensationAmount || '')
  );
  const [submitting, setSubmitting] = useState(false);

  const statusConfig = COMPLAINT_STATUS_CONFIG[complaint.status as keyof typeof COMPLAINT_STATUS_CONFIG];
  const categories = Array.isArray(complaint.category) ? complaint.category : [complaint.category];

  const handleResolve = async () => {
    if (!resolution.trim()) {
      toast.error('Vui lòng nhập nội dung phản hồi.');
      return;
    }
    setSubmitting(true);
    try {
      await complaintService.resolve(complaint._id, {
        resolution,
        compensationType,
        compensationAmount: Number(compensationAmount) || 0,
      });
      toast.success('Đã gửi phản hồi cho khách hàng.');
      onResolved();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Có lỗi xảy ra.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[92vh] overflow-y-auto">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between sticky top-0 bg-white z-10">
          <div>
            <h3 className="font-semibold text-slate-900">Chi tiết khiếu nại</h3>
            <p className="text-xs font-mono text-blue-600 mt-0.5">{complaint.complaintCode}</p>
          </div>
          <div className="flex items-center gap-2">
            {statusConfig && (
              <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${statusConfig.className}`}>
                {statusConfig.label}
              </span>
            )}
            <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-xl leading-none">×</button>
          </div>
        </div>

        {loading ? (
          <div className="p-8 text-center text-slate-400 text-sm">Đang tải...</div>
        ) : (
          <div className="p-6 space-y-5">
            {/* Category tags */}
            <div className="flex flex-wrap gap-1.5">
              {categories.map((cat) => (
                <span key={cat} className="px-3 py-1 bg-rose-100 text-rose-700 rounded-full text-xs font-semibold">
                  {COMPLAINT_CATEGORY_LABELS[cat as keyof typeof COMPLAINT_CATEGORY_LABELS] || cat}
                </span>
              ))}
            </div>

            {/* Nội dung khiếu nại */}
            <div className="bg-rose-50 border border-rose-100 rounded-xl p-4">
              <p className="text-xs font-semibold text-rose-600 mb-2">Nội dung khiếu nại từ khách</p>
              <p className="text-sm text-slate-700 leading-relaxed">{complaint.description}</p>
              <p className="text-xs text-slate-400 mt-2">
                Gửi lúc: {new Date(complaint.createdAt).toLocaleString('vi-VN')}
              </p>
            </div>

            {/* Khách hàng + Thiết bị */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-slate-50 rounded-xl p-4">
                <p className="text-xs font-bold text-slate-600 uppercase tracking-wide mb-3">👤 Khách hàng</p>
                <InfoRow label="Họ tên" value={complaint.customer?.fullName} />
                <InfoRow label="Số điện thoại" value={complaint.customer?.phone} />
                <InfoRow label="Email" value={complaint.customer?.email} />
                {complaint.customer?.address && (
                  <InfoRow label="Địa chỉ" value={complaint.customer.address} />
                )}
              </div>
              <div className="bg-slate-50 rounded-xl p-4">
                <p className="text-xs font-bold text-slate-600 uppercase tracking-wide mb-3">📱 Thiết bị</p>
                <InfoRow label="Loại" value={complaint.ticket?.device?.deviceType} />
                <InfoRow
                  label="Hãng / Model"
                  value={`${complaint.ticket?.device?.brand || ''} ${complaint.ticket?.device?.model || ''}`.trim()}
                />
                <InfoRow label="Vấn đề ban đầu" value={(complaint.ticket as any)?.initialIssue} />
              </div>
            </div>

            {/* Phiếu sửa chữa */}
            <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
              <p className="text-xs font-bold text-blue-700 uppercase tracking-wide mb-3">🔧 Phiếu sửa chữa</p>
              <div className="grid grid-cols-2 gap-x-4">
                <InfoRow
                  label="Mã phiếu"
                  value={<span className="font-mono text-blue-700">{complaint.ticket?.ticketCode}</span>}
                />
                <InfoRow
                  label="Trạng thái"
                  value={TICKET_STATUS_LABELS[complaint.ticket?.status as keyof typeof TICKET_STATUS_LABELS] || complaint.ticket?.status}
                />
                <InfoRow
                  label="Ngày tiếp nhận"
                  value={complaint.ticket?.createdAt
                    ? new Date(complaint.ticket.createdAt).toLocaleDateString('vi-VN')
                    : undefined}
                />
                <InfoRow
                  label="Ngày hoàn thành"
                  value={(complaint.ticket as any)?.completedAt
                    ? new Date((complaint.ticket as any).completedAt).toLocaleDateString('vi-VN')
                    : undefined}
                />
                <InfoRow
                  label="Chi phí cuối"
                  value={(complaint.ticket as any)?.finalCost
                    ? (complaint.ticket as any).finalCost.toLocaleString('vi-VN') + ' ₫'
                    : undefined}
                />
              </div>
            </div>

            {/* Nhân sự */}
            <div className="bg-violet-50 border border-violet-100 rounded-xl p-4">
              <p className="text-xs font-bold text-violet-700 uppercase tracking-wide mb-3">👥 Nhân sự liên quan</p>
              <InfoRow
                label="Lễ tân tiếp nhận"
                value={(complaint.ticket as any)?.createdBy?.fullName
                  ? <span>{(complaint.ticket as any).createdBy.fullName} <span className="text-slate-400">({(complaint.ticket as any).createdBy.role})</span></span>
                  : undefined}
              />
              <InfoRow
                label="Manager phân công"
                value={(complaint.ticket as any)?.managerAssignedBy?.fullName || undefined}
              />
              <InfoRow
                label="Kỹ thuật viên"
                value={complaint.ticket?.technician?.fullName
                  ? <span className="font-semibold text-violet-700">{complaint.ticket.technician.fullName}</span>
                  : <span className="text-slate-400">Chưa phân công</span>}
              />
            </div>

            {/* Chẩn đoán */}
            {(complaint.ticket as any)?.quote?.diagnosisResult && (
              <div className="bg-amber-50 border border-amber-100 rounded-xl p-4">
                <p className="text-xs font-bold text-amber-700 uppercase tracking-wide mb-3">📋 Chẩn đoán & Báo giá</p>
                <InfoRow label="Kết quả chẩn đoán" value={(complaint.ticket as any).quote.diagnosisResult} />
                {(complaint.ticket as any).quote.workDescription && (
                  <InfoRow label="Hạng mục sửa" value={(complaint.ticket as any).quote.workDescription} />
                )}
                {(complaint.ticket as any).quote.laborCost !== undefined && (
                  <InfoRow label="Tiền công" value={(complaint.ticket as any).quote.laborCost.toLocaleString('vi-VN') + ' ₫'} />
                )}
              </div>
            )}

            {/* Linh kiện */}
            {(complaint.ticket as any)?.repairParts?.length > 0 && (
              <div className="bg-white border rounded-xl overflow-hidden">
                <p className="text-xs font-bold text-slate-600 uppercase tracking-wide px-4 py-3 border-b bg-slate-50">
                  🔩 Linh kiện đã sử dụng
                </p>
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
                    {(complaint.ticket as any).repairParts.map((p: any, i: number) => (
                      <tr key={i} className="border-t border-slate-100">
                        <td className="px-3 py-2 font-medium">
                          {p.part?.partName || 'N/A'}{p.part?.brand ? ` (${p.part.brand})` : ''}
                        </td>
                        <td className="px-3 py-2 text-center">{p.quantity}</td>
                        <td className="px-3 py-2 text-right">
                          {(p.unitPrice || p.part?.price || 0).toLocaleString('vi-VN')} ₫
                        </td>
                        <td className="px-3 py-2 text-center">
                          {p.part?.warrantyMonths ? `${p.part.warrantyMonths} tháng` : '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Lịch sử */}
            {(complaint.ticket as any)?.statusHistory?.length > 0 && (
              <div className="bg-white border rounded-xl p-4">
                <p className="text-xs font-bold text-slate-600 uppercase tracking-wide mb-3">📅 Lịch sử xử lý phiếu</p>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {[...(complaint.ticket as any).statusHistory].reverse().map((h: any, i: number) => (
                    <div key={i} className="flex items-start gap-3 text-xs">
                      <div className="w-1.5 h-1.5 rounded-full bg-slate-400 mt-1.5 shrink-0" />
                      <div>
                        <span className="font-semibold text-slate-700">
                          {TICKET_STATUS_LABELS[h.status as keyof typeof TICKET_STATUS_LABELS] || h.status}
                        </span>
                        {h.changedBy && <span className="text-slate-400"> · {h.changedBy.fullName}</span>}
                        <span className="text-slate-400"> · {new Date(h.changedAt).toLocaleString('vi-VN')}</span>
                        {h.note && <p className="text-slate-500 mt-0.5">{h.note}</p>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Form xử lý hoặc kết quả */}
            {complaint.status !== 'CLOSED' ? (
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
                    <select
                      value={compensationType}
                      onChange={(e) => setCompensationType(e.target.value as CompensationType)}
                      className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm"
                    >
                      {COMPENSATION_OPTIONS.map((o) => (
                        <option key={o.value} value={o.value}>{o.label}</option>
                      ))}
                    </select>
                  </div>
                  {(compensationType === 'REFUND' || compensationType === 'DISCOUNT') && (
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-slate-600">Số tiền (₫)</label>
                      <input
                        type="number"
                        min="0"
                        value={compensationAmount}
                        onChange={(e) => setCompensationAmount(e.target.value)}
                        className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm"
                        placeholder="0"
                      />
                    </div>
                  )}
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={handleResolve}
                    disabled={submitting}
                    className="flex-1 py-2.5 rounded-xl bg-violet-600 text-white font-semibold text-sm disabled:opacity-60"
                  >
                    {submitting ? 'Đang gửi...' : '📧 Gửi phản hồi cho khách'}
                  </button>
                  <button onClick={onClose} className="px-6 py-2.5 rounded-xl border text-sm">Đóng</button>
                </div>
              </div>
            ) : (
              <div className="border-t border-slate-100 pt-4">
                <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 space-y-2">
                  <p className="text-xs font-bold text-emerald-700">
                    ✅ Đã xử lý · {complaint.resolvedAt ? new Date(complaint.resolvedAt).toLocaleString('vi-VN') : ''}
                  </p>
                  <p className="text-sm text-slate-700 leading-relaxed">{complaint.resolution}</p>
                  {complaint.compensationType && complaint.compensationType !== 'NONE' && (
                    <p className="text-xs text-slate-500 font-medium">
                      Bồi thường: {COMPENSATION_OPTIONS.find((o) => o.value === complaint.compensationType)?.label}
                      {complaint.compensationAmount
                        ? ` — ${Number(complaint.compensationAmount).toLocaleString('vi-VN')} ₫`
                        : ''}
                    </p>
                  )}
                </div>
                <button onClick={onClose} className="mt-3 w-full py-2.5 rounded-xl border text-sm">Đóng</button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
