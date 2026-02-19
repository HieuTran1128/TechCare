import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Plus, Clock } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface Ticket {
  _id: string;
  ticketCode: string;
  device: {
    brand: string;
    model: string;
    customer?: { fullName: string };
  };
  initialIssue: string;
  status: string;
  technician?: { _id: string; fullName: string };
}

const TechnicianBoard: React.FC = () => {
  const { user } = useAuth();
  const role = user?.role;
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [technicians, setTechnicians] = useState<{ id: string; name: string }[]>([]);
  const [filterTech, setFilterTech] = useState('All');
  const [loading, setLoading] = useState(true);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  const [newTicket, setNewTicket] = useState({
    deviceId: '',
    initialIssue: '',
    technicianId: '',
  });

  const isManager = role?.toUpperCase() === 'MANAGER';
  const isTechnician = role?.toUpperCase() === 'TECHNICIAN';
  console.log('=== DEBUG AUTH ===');
  console.log('user object from context:', user);             // toàn bộ user object (phải có trường role)
  console.log('derived role string:', role);                   // role lấy từ user
  console.log('typeof role:', typeof role);
  console.log('isManager computed:', isManager);
  console.log('role?.toUpperCase() === "MANAGER" ?', role?.toUpperCase() === 'MANAGER');

const fetchTickets = async () => {
  setLoading(true);
  try {
    const params: Record<string, any> = { limit: 100 };

    if (isManager) {
      if (filterTech !== 'All') {
        params.technicianId = filterTech;
      }
    } else if (isTechnician && user?._id) {
      params.technicianId = user._id;
    }

    const res = await axios.get('/api/ticket', {
      params,
      headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
    });

    console.log('API response:', res.data);           
  console.log('res.data?.data:', res.data?.data);
  console.log('typeof res.data?.data:', typeof res.data?.data);

    // Bảo vệ 
    const receivedData = res.data?.data ?? res.data ?? [];
    
    // Kiểm tra và ép kiểu về array
    const ticketArray = Array.isArray(receivedData) ? receivedData : [];
    
    setTickets(ticketArray);
  } catch (err: any) {
    console.error('Lỗi fetch tickets:', err);
    setTickets([]); // luôn reset về mảng rỗng khi lỗi
  } finally {
    setLoading(false);
  }
};

  const fetchTechnicians = async () => {
  if (!isManager) return;

  try {
    const res = await axios.get('http://localhost:3000/api/users', {
      params: { role: 'TECHNICIAN' },   // ← uppercase để chắc chắn
      headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
    });

    console.log('Users API full response:', res.data);

    let usersList = [];

    if (res.data?.data && Array.isArray(res.data.data)) {
      usersList = res.data.data;
    } else if (Array.isArray(res.data)) {
      usersList = res.data;
    }

    setTechnicians(
      usersList.map((u: any) => ({
        id: u._id,
        name: u.fullName || 'Không tên',
      }))
    );

    console.log('Technicians loaded:', usersList.length);
  } catch (err: any) {
    console.error('Fetch technicians failed:', err?.response?.data || err);
    setTechnicians([]);
  }
};

  useEffect(() => {
    fetchTickets();
    fetchTechnicians();
  }, [filterTech, isManager]); // thêm isManager để an toàn

  const handleAddTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isManager) return;

    try {
      const token = localStorage.getItem('token');

      // Tạo phiếu
      const createRes = await axios.post(
        '/api/ticket',
        {
          deviceId: newTicket.deviceId,
          initialIssue: newTicket.initialIssue,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const ticketId = createRes.data._id;

      // Phân công
      await axios.patch(
        `/api/ticket/${ticketId}/assign`,
        { technicianId: newTicket.technicianId },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setIsAddModalOpen(false);
      setNewTicket({ deviceId: '', initialIssue: '', technicianId: '' });
      fetchTickets();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Không thể tạo & phân công phiếu');
    }
  };

  const handleDiagnose = async (id: string) => {
    if (!isTechnician) return;

    try {
      await axios.patch(
        `/api/ticket/${id}/diagnose`,
        {
          diagnosisResult: 'Đang xử lý',
          estimatedCost: 0,
        },
        {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
        }
      );
      fetchTickets();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Không thể bắt đầu xử lý');
    }
  };

  const getDisplayStatus = (status: string) => {
    if (['RECEIVED', 'ASSIGNED'].includes(status)) return 'pending';
    if (['IN_PROGRESS', 'WAITING_APPROVAL'].includes(status)) return 'in-progress';
    if (['COMPLETED', 'REJECTED'].includes(status)) return 'completed';
    return 'pending';
  };

  const renderColumn = (title: string, statusKey: string) => {
    const filtered = Array.isArray(tickets)
    ? tickets.filter((t) => getDisplayStatus(t.status) === statusKey)
    : [];

  return (
    <div className="flex-1 bg-white rounded-xl shadow p-4 min-w-[320px]">
      <h2 className="font-bold text-lg mb-4">{title}</h2>

      {filtered.length === 0 && !loading && (
        <div className="text-center text-gray-500 py-8">
          Không có phiếu nào trong trạng thái này
        </div>
      )}

        {filtered.map((ticket) => (
          <div key={ticket._id} className="border p-3 rounded-lg mb-3 bg-gray-50 hover:bg-gray-100 transition">
            <div className="font-semibold">
              {ticket.device?.brand} {ticket.device?.model}
            </div>
            <div className="text-sm text-gray-600 mt-1">{ticket.initialIssue}</div>

            <div className="flex justify-between mt-2 text-xs text-gray-500">
              <span className="font-mono">{ticket.ticketCode}</span>
              <span className="flex items-center gap-1">
                <Clock size={12} /> {ticket.status}
              </span>
            </div>

            {isTechnician && getDisplayStatus(ticket.status) === 'pending' && (
              <button
                onClick={() => handleDiagnose(ticket._id)}
                className="mt-3 w-full text-sm bg-blue-600 hover:bg-blue-700 text-white py-1.5 rounded transition"
              >
                Bắt đầu xử lý
              </button>
            )}
          </div>
        ))}

        {isManager && statusKey === 'pending' && (
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="w-full mt-4 border-2 border-dashed border-gray-300 p-3 rounded text-sm flex items-center justify-center gap-2 hover:border-gray-400 transition"
          >
            <Plus size={16} /> Thêm phiếu mới
          </button>
        )}
      </div>
    );
  };

  return (
    <div className="p-6 max-w-[1600px] mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <h1 className="text-2xl font-bold">
          {isManager ? 'Quản lý phiếu sửa chữa' : 'Công việc của tôi'}
        </h1>

        {isManager && (
          <select
            value={filterTech}
            onChange={(e) => setFilterTech(e.target.value)}
            className="border border-gray-300 p-2 rounded min-w-[220px]"
          >
            <option value="All">Tất cả kỹ thuật viên</option>
            {technicians.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>
        )}
      </div>

      {loading ? (
        <div className="text-center py-10">Đang tải dữ liệu...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {renderColumn('Chờ xử lý', 'pending')}
          {renderColumn('Đang xử lý', 'in-progress')}
          {renderColumn('Hoàn thành / Từ chối', 'completed')}
        </div>
      )}

      {/* Modal tạo phiếu – chỉ Manager */}
      {isAddModalOpen && isManager && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-5">Tạo phiếu sửa chữa mới</h2>

            <form onSubmit={handleAddTicket}>
              <input
                type="text"
                placeholder="Device ID"
                value={newTicket.deviceId}
                onChange={(e) => setNewTicket({ ...newTicket, deviceId: e.target.value })}
                className="w-full border p-3 mb-4 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />

              <textarea
                placeholder="Mô tả lỗi ban đầu"
                value={newTicket.initialIssue}
                onChange={(e) => setNewTicket({ ...newTicket, initialIssue: e.target.value })}
                className="w-full border p-3 mb-4 rounded h-24 focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />

              <select
                value={newTicket.technicianId}
                onChange={(e) => setNewTicket({ ...newTicket, technicianId: e.target.value })}
                className="w-full border p-3 mb-5 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value="">Chọn kỹ thuật viên</option>
                {technicians.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="flex-1 bg-gray-300 hover:bg-gray-400 py-3 rounded transition"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-3 rounded transition"
                >
                  Tạo & Phân công
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export { TechnicianBoard };