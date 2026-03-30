import React, { useEffect, useState, useMemo } from 'react';
import { ShieldCheck, ShieldOff, Search, AlertTriangle, Wrench } from 'lucide-react';
import { warrantyService } from '../services';
import type { WarrantyItem } from '../types';

export const Warranty: React.FC = () => {
  const [warranties, setWarranties] = useState<WarrantyItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'expired'>('all');
  const [claimModal, setClaimModal] = useState<WarrantyItem | null>(null);
  const [claimType, setClaimType] = useState<'STORE_FAULT' | 'CUSTOMER_FAULT'>('STORE_FAULT');
  const [claimNote, setClaimNote] = useState('');
  const [claimLoading, setClaimLoading] = useState(false);
  const [message, setMessage] = useState('');

  const load = async () => {
    setLoading(true);
    try {
      const data = await warrantyService.getAll(statusFilter);
      setWarranties(data || []);
    } catch {
      setWarranties([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [statusFilter]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return warranties;
    return warranties.filter((w) =>
      String(w.ticket?.ticketCode || '').toLowerCase().includes(q) ||
      String(w.ticket?.device?.customer?.phone || '').includes(q) ||
      String(w.ticket?.device?.customer?.fullName || '').toLowerCase().includes(q)
    );
  }, [warranties, search]);

  const handleClaim = async () => {
    if (!claimModal) return;
    setClaimLoading(true);
    setMessage('');
    try {
      const res = await warrantyService.claim(claimModal._id, { claimType, claimNote });
      setMessage(
        claimType === 'STORE_FAULT'
          ? `Đã kích hoạt bảo hành miễn phí cho phiếu ${res.ticket?.ticketCode}. Phiếu đang chờ phân công kỹ thuật viên.`
          : `Đã từ chối bảo hành. Khách hàng tự chịu chi phí nếu muốn sửa tiếp.`
      );
      setClaimModal(null);
      setClaimNote('');
      load();
    } catch (err: any) {
      const msgMap: Record<string, string> = {
        WARRANTY_INACTIVE: 'Bảo hành này đã được sử dụng.',
        WARRANTY_EXPIRED: 'Bảo hành đã hết hạn.',
        NOT_FOUND: 'Không tìm thấy bảo hành.',
        INVALID_CLAIM_TYPE: 'Loại bảo hành không hợp lệ.',
      };
      setMessage(msgMap[err.response?.data?.message] || 'Có lỗi xảy ra.');
    } finally {
      setClaimLoading(false);
    }
  };

  const isExpired = (w: WarrantyItem) => w.endDate && new Date(w.endDate) < new Date();

  const warrantyStatusLabel = (w: WarrantyItem) => {
    if (!w.isActive) return { label: 'Đã dùng', color: 'bg-slate-100 text-slate-500' };
    if (isExpired(w)) return { label: 'Hết hạn', color: 'bg-red-100 text-red-600' };
    return { label: 'Còn hiệu lực', color: 'bg-emerald-100 text-emerald-700' };
  };

  const claimTypeLabel = (type?: string) => {
    if (type === 'STORE_FAULT') return { label: 'Lỗi cửa hàng · Miễn phí', color: 'bg-emerald-100 text-emerald-700' };
    if (type === 'CUSTOMER_FAULT') return { label: 'Lỗi khách · Từ chối', color: 'bg-orange-100 text-orange-700' };
    return null;
  };

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-black text-slate-900">Bảo hành</h1>
        <p className="text-sm text-slate-500 mt-1">Tra cứu và xử lý yêu cầu bảo hành linh kiện sau sửa chữa.</p>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Tìm theo mã phiếu, tên hoặc SĐT khách..." className="w-full border rounded-xl pl-9 pr-3 py-2.5 text-sm bg-white" />
        </div>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as any)} className="border rounded-xl px-3 py-2.5 text-sm bg-white">
          <option value="all">Tất cả</option>
          <option value="active">Còn hiệu lực</option>
          <option value="expired">Hết hạn / Đã dùng</option>
        </select>
      </div>

      {message && <p className="text-sm text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-2">{message}</p>}

      {loading ? (
        <p className="text-sm text-slate-500">Đang tải...</p>
      ) : filtered.length === 0 ? (
        <p className="text-sm text-slate-500">Không có bảo hành nào.</p>
      ) : (
        <div className="space-y-3">
          {filtered.map((w) => {
            const { label: statusLabel, color: statusColor } = warrantyStatusLabel(w);
            const claimInfo = claimTypeLabel(w.claimType);
            const canClaim = w.isActive && !isExpired(w);

            return (
              <div key={w._id} className="bg-white border rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-bold text-slate-900">{w.ticket?.ticketCode || '-'}</span>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${statusColor}`}>{statusLabel}</span>
                    {claimInfo && <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${claimInfo.color}`}>{claimInfo.label}</span>}
                  </div>
                  <p className="text-sm text-slate-700">Khách: <strong>{w.ticket?.device?.customer?.fullName || '-'}</strong>{w.ticket?.device?.customer?.phone && <span className="text-slate-500"> · {w.ticket.device.customer.phone}</span>}</p>
                  <p className="text-sm text-slate-600">Thiết bị: {w.ticket?.device?.deviceType} {w.ticket?.device?.brand} {w.ticket?.device?.model}</p>
                  <p className="text-sm text-slate-600">Linh kiện: <strong>{w.part?.partName || '-'}</strong>{w.part?.brand ? ` (${w.part.brand})` : ''} · {w.warrantyMonths} tháng</p>
                  <p className="text-xs text-slate-500">{new Date(w.startDate).toLocaleDateString('vi-VN')} → {new Date(w.endDate).toLocaleDateString('vi-VN')}</p>
                  {!w.isActive && w.claimedAt && <p className="text-xs text-slate-400">Xử lý lúc {new Date(w.claimedAt).toLocaleString('vi-VN')}{w.claimedBy ? ` bởi ${w.claimedBy.fullName}` : ''}</p>}
                  {w.claimNote && <p className="text-xs text-slate-500 italic">"{w.claimNote}"</p>}
                </div>
                {canClaim ? (
                  <button onClick={() => { setClaimModal(w); setClaimNote(''); setClaimType('STORE_FAULT'); setMessage(''); }} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 text-white text-sm font-semibold whitespace-nowrap">
                    <ShieldCheck size={15} /> Xử lý bảo hành
                  </button>
                ) : (
                  <div className="flex items-center gap-1 text-slate-400 text-sm whitespace-nowrap">
                    <ShieldOff size={15} /> {isExpired(w) && w.isActive ? 'Hết hạn' : 'Đã xử lý'}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {claimModal && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl p-5 space-y-4">
            <h3 className="text-lg font-bold">Xử lý yêu cầu bảo hành</h3>
            <div className="rounded-xl border p-3 text-sm space-y-1 bg-slate-50">
              <p><span className="text-slate-500">Phiếu gốc:</span> <strong>{claimModal.ticket?.ticketCode}</strong></p>
              <p><span className="text-slate-500">Khách:</span> {claimModal.ticket?.device?.customer?.fullName}</p>
              <p><span className="text-slate-500">Linh kiện:</span> {claimModal.part?.partName}{claimModal.part?.brand ? ` (${claimModal.part.brand})` : ''}</p>
              <p><span className="text-slate-500">Hạn bảo hành:</span> {new Date(claimModal.endDate).toLocaleDateString('vi-VN')}</p>
            </div>
            <div className="space-y-2">
              <p className="text-sm font-semibold text-slate-700">Nguyên nhân lỗi</p>
              <div className="grid grid-cols-2 gap-2">
                <button type="button" onClick={() => setClaimType('STORE_FAULT')} className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 transition-all text-sm font-semibold ${claimType === 'STORE_FAULT' ? 'border-emerald-500 bg-emerald-50 text-emerald-700' : 'border-slate-200 text-slate-600'}`}>
                  <Wrench size={18} className={claimType === 'STORE_FAULT' ? 'text-emerald-600' : 'text-slate-400'} />
                  <span>Lỗi cửa hàng</span>
                  <span className="text-xs font-normal text-center">Sửa lại / Đổi linh kiện miễn phí</span>
                </button>
                <button type="button" onClick={() => setClaimType('CUSTOMER_FAULT')} className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 transition-all text-sm font-semibold ${claimType === 'CUSTOMER_FAULT' ? 'border-orange-500 bg-orange-50 text-orange-700' : 'border-slate-200 text-slate-600'}`}>
                  <AlertTriangle size={18} className={claimType === 'CUSTOMER_FAULT' ? 'text-orange-500' : 'text-slate-400'} />
                  <span>Lỗi khách</span>
                  <span className="text-xs font-normal text-center">Rơi vỡ, vào nước / Từ chối BH</span>
                </button>
              </div>
            </div>
            {claimType === 'STORE_FAULT' && <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-3 text-xs text-emerald-700">Hệ thống sẽ kích hoạt lại phiếu bảo hành miễn phí, chờ phân công kỹ thuật viên.</div>}
            {claimType === 'CUSTOMER_FAULT' && <div className="rounded-xl bg-orange-50 border border-orange-200 p-3 text-xs text-orange-700">Bảo hành sẽ bị từ chối. Khách hàng tự chịu chi phí sửa chữa nếu muốn tiếp tục.</div>}
            <div className="space-y-1">
              <label className="text-sm font-medium text-slate-700">Ghi chú</label>
              <textarea value={claimNote} onChange={(e) => setClaimNote(e.target.value)} rows={2} placeholder={claimType === 'STORE_FAULT' ? 'Mô tả lỗi khách phản ánh...' : 'Mô tả nguyên nhân (rơi vỡ, vào nước...)'} className="w-full border rounded-xl px-3 py-2.5 text-sm" />
            </div>
            <div className="flex gap-2 justify-end">
              <button onClick={() => setClaimModal(null)} className="px-3 py-2 rounded-lg border text-slate-700 text-sm font-semibold">Hủy</button>
              <button onClick={handleClaim} disabled={claimLoading} className={`px-4 py-2 rounded-lg text-white text-sm font-semibold disabled:opacity-60 ${claimType === 'STORE_FAULT' ? 'bg-emerald-600' : 'bg-orange-500'}`}>
                {claimLoading ? 'Đang xử lý...' : claimType === 'STORE_FAULT' ? 'Tạo phiếu bảo hành (Free)' : 'Từ chối bảo hành'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
