import React, { useEffect, useMemo, useState } from 'react';
import { Search, AlertTriangle, Loader2, Smartphone, Clock, Phone, Mail, User } from 'lucide-react';
import axios from 'axios';

const API_BASE = 'http://localhost:3000/api';

interface Ticket {
  _id: string;
  ticketCode: string;
  initialIssue: string;
  status: string;
  createdAt: string;
  inventoryRequest?: {
    status?: string;
  };
  device?: {
    brand?: string;
    model?: string;
    deviceType?: string;
    customer?: {
      fullName?: string;
      phone?: string;
      email?: string;
    };
  };
}

const getStatusBadge = (status: string, inventoryStatus?: string) => {
  const colors: Record<string, string> = {
    RECEIVED: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300',
    DIAGNOSING: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
    WAITING_INVENTORY: 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900/30 dark:text-cyan-300',
    INVENTORY_APPROVED: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300',
    INVENTORY_REJECTED: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
    QUOTED: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300',
    CUSTOMER_APPROVED: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300',
    CUSTOMER_REJECTED: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
    IN_PROGRESS: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300',
    COMPLETED: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
  };

  const isInventoryRejected = status === 'CUSTOMER_REJECTED' && inventoryStatus === 'REJECTED';

  const labels: Record<string, string> = {
    RECEIVED: 'Tiếp nhận',
    DIAGNOSING: 'Kỹ thuật kiểm tra',
    WAITING_INVENTORY: 'Chờ kho duyệt',
    INVENTORY_APPROVED: 'Kho đã duyệt',
    INVENTORY_REJECTED: 'Kho từ chối',
    QUOTED: 'Đã gửi báo giá',
    CUSTOMER_APPROVED: 'Khách đồng ý',
    CUSTOMER_REJECTED: isInventoryRejected ? 'Kho từ chối' : 'Khách từ chối',
    IN_PROGRESS: 'Đang sửa',
    COMPLETED: 'Hoàn thành',
  };

  return (
    <span
      className={`text-xs px-2.5 py-0.5 rounded-full font-bold uppercase ${
        colors[status] || 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300'
      }`}
    >
      {labels[status] || status}
    </span>
  );
};

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

        const res = await axios.get(`${API_BASE}/ticket`, {
          params: { limit: 100, sort: '-createdAt' },
          withCredentials: true,
        });

        setTickets(res.data.data || []);
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
        `${device?.brand || ''} ${device?.model || ''} ${device?.deviceType || ''}`.toLowerCase().includes(q)
      );
    });
  }, [search, tickets]);

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-12 pt-4 px-4 md:px-0">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">Danh sách phiếu sửa chữa</h1>
        <p className="text-slate-500 dark:text-slate-400">Hiển thị thông tin khách hàng từ bước tiếp nhận</p>
      </div>

      <div className="max-w-xl mx-auto relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Tìm theo mã phiếu, tên, SĐT, email hoặc máy..."
          className="w-full h-12 pl-12 pr-6 rounded-full border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-sm focus:border-blue-500 dark:text-white"
        />
      </div>

      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 p-6 rounded-2xl border border-red-100 dark:border-red-900/30 text-center">
          <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-3" />
          <p className="text-red-600 dark:text-red-400 font-medium">{error}</p>
        </div>
      )}

      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <Loader2 className="animate-spin text-blue-500" size={48} />
        </div>
      ) : filteredTickets.length === 0 ? (
        <div className="text-center py-16 text-slate-500 dark:text-slate-400">Chưa có phiếu phù hợp</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTickets.map((ticket) => {
            const customer = ticket.device?.customer;
            const device = ticket.device;

            return (
              <div key={ticket._id} className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg border border-slate-100 dark:border-slate-700 overflow-hidden">
                <div className="p-6 space-y-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="text-lg font-bold text-slate-900 dark:text-white">#{ticket.ticketCode}</h3>
                    </div>
                    {getStatusBadge(ticket.status, ticket.inventoryRequest?.status)}
                  </div>

                  <div className="space-y-1 text-sm text-slate-700 dark:text-slate-200">
                    <p className="flex items-center gap-2"><User size={14} /> {customer?.fullName || 'N/A'}</p>
                    <p className="flex items-center gap-2"><Phone size={14} /> {customer?.phone || 'N/A'}</p>
                    <p className="flex items-center gap-2"><Mail size={14} /> {customer?.email || 'N/A'}</p>
                    <p className="flex items-center gap-2"><Smartphone size={14} /> {device?.brand || ''} {device?.model || ''} ({device?.deviceType || 'N/A'})</p>
                  </div>

                  <p className="text-sm text-slate-600 dark:text-slate-300 pt-1">Lỗi: {ticket.initialIssue}</p>

                  <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-2 pt-2">
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
