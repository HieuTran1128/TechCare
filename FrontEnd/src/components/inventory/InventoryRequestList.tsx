import React from 'react';
import type { InventoryRequest } from '../../types';

interface InventoryRequestListProps {
  requests: InventoryRequest[];
  onRespond: (ticketId: string, available: boolean) => Promise<void>;
}

export const InventoryRequestList: React.FC<InventoryRequestListProps> = ({ requests, onRespond }) => {
  if (requests.length === 0) return <p className="text-slate-500 text-sm">Chưa có yêu cầu nào.</p>;

  return (
    <div className="space-y-3 text-sm">
      {requests.map((ticket) => {
        const techFromHistory = [...(ticket.statusHistory || [])].reverse().find((h) => h.changedBy?.role === 'technician' && h.changedBy?.fullName)?.changedBy;
        const technicianName = ticket.inventoryRequest?.requestedBy?.fullName || ticket.technician?.fullName || techFromHistory?.fullName || 'N/A';
        const requiredParts = ticket.inventoryRequest?.requiredParts || [];
        const totalPartsCost = requiredParts.reduce((sum, item) => {
          const unitPrice = Number(item.part?.price ?? item.unitPrice ?? 0);
          return sum + unitPrice * Number(item.quantity || 0);
        }, 0);

        const statusConfig = {
          APPROVED: { label: 'Đã duyệt', cls: 'bg-emerald-100 text-emerald-700' },
          REJECTED: { label: 'Đã từ chối', cls: 'bg-rose-100 text-rose-700' },
          PENDING: { label: 'Chờ duyệt', cls: 'bg-amber-100 text-amber-700' },
        };
        const st = statusConfig[ticket.inventoryRequest?.status as keyof typeof statusConfig] || statusConfig.PENDING;

        return (
          <div key={ticket._id} className="rounded-2xl border p-4 hover:shadow-sm transition-shadow">
            <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
              <div>
                <p className="font-semibold text-slate-900">{ticket.ticketCode || ticket._id}</p>
                <p className="text-xs text-slate-700">Khách: {ticket.device?.customer?.fullName || 'N/A'}</p>
                <p className="text-xs text-slate-500">{ticket.device?.deviceType || '-'} • {ticket.device?.brand || '-'} • {ticket.device?.model || '-'}</p>
                <p className="text-xs text-slate-500">Kỹ thuật: {technicianName}</p>
              </div>
              <span className={`text-xs px-2.5 py-1 rounded-full font-semibold ${st.cls}`}>{st.label}</span>
            </div>

            <div className="text-xs text-slate-500 mb-3 bg-slate-50 rounded-lg px-3 py-2">
              {ticket.inventoryRequest?.noteFromTechnician || 'Không có ghi chú'}
            </div>

            <div className="overflow-x-auto rounded-xl border border-slate-100">
              <table className="w-full text-xs">
                <thead className="bg-slate-50 text-slate-600">
                  <tr>
                    <th className="text-left px-3 py-2">Linh kiện</th>
                    <th className="text-left px-3 py-2">Số lượng</th>
                    <th className="text-left px-3 py-2">Đơn giá</th>
                    <th className="text-left px-3 py-2">Thành tiền</th>
                  </tr>
                </thead>
                <tbody>
                  {requiredParts.map((item, index) => {
                    const unitPrice = Number(item.part?.price ?? item.unitPrice ?? 0);
                    const quantity = Number(item.quantity || 0);
                    return (
                      <tr key={index} className="border-t border-slate-100">
                        <td className="px-3 py-2">{item.part?.partName || 'Linh kiện'} {item.part?.brand ? `(${item.part.brand})` : ''}</td>
                        <td className="px-3 py-2">{quantity}</td>
                        <td className="px-3 py-2">{unitPrice.toLocaleString('vi-VN')} ₫</td>
                        <td className="px-3 py-2 font-semibold">{(unitPrice * quantity).toLocaleString('vi-VN')} ₫</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
              <p className="text-xs font-semibold text-slate-700">Tổng: {totalPartsCost.toLocaleString('vi-VN')} ₫</p>
              {ticket.inventoryRequest?.status === 'PENDING' && (
                <div className="flex gap-2">
                  <button onClick={() => onRespond(ticket._id, true)} className="px-3 py-1.5 rounded-lg bg-emerald-600 text-white text-xs font-semibold">Duyệt</button>
                  <button onClick={() => onRespond(ticket._id, false)} className="px-3 py-1.5 rounded-lg bg-rose-600 text-white text-xs font-semibold">Từ chối</button>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};
