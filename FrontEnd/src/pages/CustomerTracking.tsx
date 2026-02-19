import React, { useState, useEffect } from 'react';
import { Search, CheckCircle, Circle, Wrench, Clock, Smartphone, MessageCircle, ArrowLeft, AlertTriangle, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';

const API_BASE = 'http://localhost:3000/api';

interface Ticket {
  _id: string;
  ticketCode: string;
  customerName: string;
  device: string;
  issue: string;
  technician: string;
  status: string;
  createdAt: string;
  estimatedCompletion?: string;
}

export const CustomerTracking: React.FC = () => {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [filteredTickets, setFilteredTickets] = useState<Ticket[]>([]);
  const [searchCode, setSearchCode] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const navigate = useNavigate();
  const { user } = useAuth();

  // Load toàn bộ ticket 
  useEffect(() => {
    const fetchTickets = async () => {
      try {
        setIsLoading(true);
        const res = await axios.get(`${API_BASE}/ticket`, {
          params: { limit: 50, sort: '-createdAt' } 
        });
        const data = res.data.data || res.data || [];
        setTickets(data);
        setFilteredTickets(data);
      } catch (err: any) {
        console.error('Lỗi tải danh sách ticket:', err);
        setError('Không thể tải danh sách phiếu sửa chữa. Vui lòng thử lại.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchTickets();
  }, []);

  // Filter theo search
  useEffect(() => {
    if (!searchCode.trim()) {
      setFilteredTickets(tickets);
      return;
    }

    const filtered = tickets.filter(ticket =>
      ticket.ticketCode.toLowerCase().includes(searchCode.trim().toLowerCase()) ||
      ticket.customerName?.toLowerCase().includes(searchCode.trim().toLowerCase())
    );
    setFilteredTickets(filtered);
  }, [searchCode, tickets]);

  const getStatusBadge = (status: string) => {
    const colors = {
      RECEIVED: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300',
      ASSIGNED: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
      WAITING_APPROVAL: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300',
      IN_PROGRESS: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300',
      COMPLETED: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
      REJECTED: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
    };

    const label = {
      RECEIVED: 'Tiếp nhận',
      ASSIGNED: 'Đã phân công',
      WAITING_APPROVAL: 'Chờ duyệt',
      IN_PROGRESS: 'Đang sửa',
      COMPLETED: 'Hoàn thành',
      REJECTED: 'Từ chối'
    }[status] || status;

    return (
      <span className={`text-xs px-2.5 py-0.5 rounded-full font-bold uppercase ${colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300'}`}>
        {label}
      </span>
    );
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-12 pt-4 px-4 md:px-0">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">Danh sách phiếu sửa chữa</h1>
        <p className="text-slate-500 dark:text-slate-400">Tra cứu và theo dõi tiến độ tất cả phiếu sửa chữa</p>
      </div>

      {/* Search */}
      <div className="max-w-lg mx-auto relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          value={searchCode}
          onChange={(e) => setSearchCode(e.target.value)}
          placeholder="Tìm theo mã phiếu hoặc tên khách hàng..."
          className="w-full h-12 pl-12 pr-6 rounded-full border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-lg shadow-sm focus:ring-0 focus:border-blue-500 dark:text-white"
        />
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 p-6 rounded-2xl border border-red-100 dark:border-red-900/30 text-center">
          <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-3" />
          <p className="text-red-600 dark:text-red-400 font-medium">{error}</p>
        </div>
      )}

      {/* Danh sách ticket */}
      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <Loader2 className="animate-spin text-blue-500" size={48} />
        </div>
      ) : filteredTickets.length === 0 ? (
        <div className="text-center py-16 text-slate-500 dark:text-slate-400">
          {searchCode ? 'Không tìm thấy phiếu phù hợp' : 'Chưa có phiếu sửa chữa nào'}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTickets.map(ticket => (
            <div 
              key={ticket._id}
              className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg border border-slate-100 dark:border-slate-700 overflow-hidden hover:shadow-xl transition-shadow cursor-pointer"
              onClick={() => navigate(`/ticket/${ticket.ticketCode}`)} // Optional: link chi tiết
            >
              <div className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white">#{ticket.ticketCode}</h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400">{ticket.customerName}</p>
                  </div>
                  {getStatusBadge(ticket.status)}
                </div>

                <p className="text-sm text-slate-600 dark:text-slate-300 mb-4 line-clamp-2">
                  {ticket.issue}
                </p>

                <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                  <div className="flex items-center gap-2">
                    <Smartphone size={16} />
                    <span>{ticket.device?.brand} {ticket.device?.model} ({ticket.device?.deviceType})</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock size={16} />
                    <span>{new Date(ticket.createdAt).toLocaleDateString('vi-VN')}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// Hàm tạo badge trạng thái (giữ nguyên như cũ)
const getStatusBadge = (status: string) => {
  const colors = {
    RECEIVED: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300',
    ASSIGNED: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
    WAITING_APPROVAL: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300',
    IN_PROGRESS: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300',
    COMPLETED: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
    REJECTED: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
  };

  const label = {
    RECEIVED: 'Tiếp nhận',
    ASSIGNED: 'Đã phân công',
    WAITING_APPROVAL: 'Chờ duyệt',
    IN_PROGRESS: 'Đang sửa',
    COMPLETED: 'Hoàn thành',
    REJECTED: 'Từ chối'
  }[status] || status;

  return (
    <span className={`text-xs px-2.5 py-0.5 rounded-full font-bold uppercase ${colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300'}`}>
      {label}
    </span>
  );
};