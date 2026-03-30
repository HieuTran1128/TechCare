import React, { useEffect, useMemo, useState } from 'react';
import { Search, AlertTriangle, Loader2, Smartphone, Clock, Phone, Mail, User } from 'lucide-react';
import { ticketService } from '../services';
import { TICKET_STATUS_LABELS, TICKET_STATUS_COLORS } from '../constants';
import type { Ticket } from '../types';

export const CustomerTracking: React.FC = () => {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchTickets = async () => {
      try {
        setIsLoading(true);
        setError('');
        const res = await ticketService.getAll({ limit: 100, sort: '-createdAt' });
        setTickets(res.data || []);
      } catch (err: any) {
        setError(err.response?.data?.message || 'Không thể tải danh sách phiếu sửa chữa. Vui lòng thử lại.');
      } finally {
        setIsLoading(false);
      }
    };
    fetchTickets();
  }, []);

  const filteredTickets = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return tickets;
    return tickets.filter((ticket) => {
      const customer = ticket.device?.customer;
      const device = ticket.device;
      return (
        ticket.ticketCode?.toLowerCase().includes(q) ||
        customer?.fullName?.toLowerCase().includes(q) ||
        customer?.phone?.toLowerCase().includes(q) ||
        customer?.email?.toLowerCase().includes(q) ||
        `${device?.brand || ''} ${device?.model || ''} ${(device as any)?.deviceType || ''}`.toLowerCase().includes(q)
      );
    });
  }, [search, tickets]);

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-12 pt-4 px-4 md:px-0">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-slate-900 mb-2">Danh sách phiếu sửa chữa</h1>
        <p className="text-slate-500">Hiển thị thông tin khách hàng từ bước tiếp nhận</p>
      </div>

      <div className="max-w-xl mx-auto relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Tìm theo mã phiếu, tên, SĐT, email hoặc máy..."
          className="w-full h-12 pl-12 pr-6 rounded-full border-2 border-slate-200 bg-white shadow-sm focus:border-blue-500"
        />
      </div>

      {error && (
        <div className="bg-red-50 p-6 rounded-2xl border border-red-100 text-center">
          <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-3" />
          <p className="text-red-600 font-medium">{error}</p>
        </div>
      )}

      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <Loader2 className="animate-spin text-blue-500" size={48} />
        </div>
      ) : filteredTickets.length === 0 ? (
        <div className="text-center py-16 text-slate-500">Chưa có phiếu phù hợp</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTickets.map((ticket) => {
            const customer = ticket.device?.customer;
            const device = ticket.device;
            const colorClass = TICKET_STATUS_COLORS[ticket.status as keyof typeof TICKET_STATUS_COLORS] || 'bg-slate-100 text-slate-700';
            const label = TICKET_STATUS_LABELS[ticket.status as keyof typeof TICKET_STATUS_LABELS] || ticket.status;

            return (
              <div key={ticket._id} className="bg-white rounded-2xl shadow-lg border border-slate-100 overflow-hidden">
                <div className="p-6 space-y-3">
                  <div className="flex justify-between items-start">
                    <h3 className="text-lg font-bold text-slate-900">#{ticket.ticketCode}</h3>
                    <span className={`text-xs px-2.5 py-0.5 rounded-full font-bold uppercase ${colorClass}`}>{label}</span>
                  </div>
                  <div className="space-y-1 text-sm text-slate-700">
                    <p className="flex items-center gap-2"><User size={14} /> {customer?.fullName || 'N/A'}</p>
                    <p className="flex items-center gap-2"><Phone size={14} /> {customer?.phone || 'N/A'}</p>
                    <p className="flex items-center gap-2"><Mail size={14} /> {customer?.email || 'N/A'}</p>
                    <p className="flex items-center gap-2"><Smartphone size={14} /> {(device as any)?.deviceType || 'N/A'} • {device?.brand || 'N/A'} • {device?.model || 'N/A'}</p>
                  </div>
                  <p className="text-sm text-slate-600 pt-1">Lỗi: {ticket.initialIssue}</p>
                  <div className="text-xs text-slate-500 flex items-center gap-2 pt-2">
                    <Clock size={14} />
                    {new Date(ticket.createdAt).toLocaleString('vi-VN')}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
