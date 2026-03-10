import React, { useState, useEffect } from 'react';
import { UserPlus, Search, Trash2, Clock, X, Ban, ShieldCheck } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';

// Định nghĩa type dựa trên backend schema
interface Employee {
  _id: string;
  fullName: string;
  email: string;
  role: 'manager' | 'technician' | 'storekeeper' | 'frontdesk';
  status: 'INVITED' | 'ACTIVE' | 'BLOCKED' | 'REJECTED';
  avatar?: string;
  phone?: string;
  createdAt?: string;
}

const API_BASE = 'http://localhost:3000/api'; // thay bằng env variable trong production

export const EmployeeManagement: React.FC = () => {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    role: 'technician' as Employee['role'],
  });

  // Load danh sách nhân viên khi mount
  useEffect(() => {
    fetchEmployees();
  }, []);

  const fetchEmployees = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${API_BASE}/users`, {
        withCredentials: true, // gửi cookie JWT
      });
      setEmployees(res.data.data || res.data); 
    } catch (err) {
      console.error(err);
      setError('Không thể tải danh sách nhân viên');
    } finally {
      setLoading(false);
    }
  };

  const handleInviteEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      await axios.post(
        `${API_BASE}/users/invite`,
        {
          fullName: formData.fullName,
          email: formData.email,
          phone: formData.phone || undefined,
          role: formData.role,
        },
        { withCredentials: true }
      );

      // Refresh danh sách
      await fetchEmployees();
      setIsModalOpen(false);
      setFormData({ fullName: '', email: '', phone: '', role: 'technician' });
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Có lỗi xảy ra khi gửi lời mời';
      setError(msg === 'EMAIL_EXISTS' ? 'Email này đã tồn tại trong hệ thống' : msg);
    } finally {
      setLoading(false);
    }
  };

  // Xóa nhân viên 
  const deleteEmployee = async (id: string) => {
    const target = employees.find((e) => e._id === id);

    if (!window.confirm(`Bạn có chắc muốn xóa nhân viên ${target?.fullName || ''}? Hành động này không thể hoàn tác.`)) return;

    try {
      await axios.delete(`${API_BASE}/users/${id}`, { withCredentials: true });
      setEmployees(employees.filter((e) => e._id !== id));
    } catch (err: any) {
      alert(err.response?.data?.message || 'Không thể xóa nhân viên');
    }
  };

  const toggleBlock = async (id: string, blocked: boolean) => {
    const target = employees.find((e) => e._id === id);
    const actionText = blocked ? 'chặn' : 'mở chặn';

    if (!window.confirm(`Xác nhận ${actionText} nhân viên ${target?.fullName || ''}?`)) return;

    try {
      await axios.patch(
        `${API_BASE}/users/${id}/block`,
        { blocked },
        { withCredentials: true },
      );

      setEmployees((prev) =>
        prev.map((e) => (e._id === id ? { ...e, status: blocked ? 'BLOCKED' : 'ACTIVE' } : e)),
      );
    } catch (err: any) {
      alert(err.response?.data?.message || 'Không thể cập nhật trạng thái');
    }
  };

  const filteredEmployees = employees.filter(
    (e) =>
      e.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      e.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getRoleBadge = (role: Employee['role']) => {
    const base = "px-2.5 py-1 rounded-full text-[10px] font-black uppercase border ";
    switch (role) {
      case 'manager':
        return <span className={`${base} bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400`}>Quản trị</span>;
      case 'technician':
        return <span className={`${base} bg-orange-100 text-orange-700 border-orange-200 dark:bg-orange-900/30 dark:text-orange-400`}>Kỹ thuật</span>;
      case 'storekeeper':
        return <span className={`${base} bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400`}>Kho hàng</span>;
      case 'frontdesk':
        return <span className={`${base} bg-purple-100 text-purple-700 border-purple-200 dark:bg-purple-900/30 dark:text-purple-400`}>Lễ tân</span>;
      default:
        return <span className={`${base} bg-slate-100 text-slate-700 border-slate-200`}>{role}</span>;
    }
  };

  const getStatusDisplay = (status: Employee['status']) => {
    switch (status) {
      case 'ACTIVE':
        return (
          <span className="text-emerald-600 dark:text-emerald-400 text-xs font-bold flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div> Hoạt động
          </span>
        );
      case 'INVITED':
        return (
          <span className="text-amber-600 dark:text-amber-400 text-xs font-bold flex items-center gap-1.5">
            <Clock size={12} /> Chờ kích hoạt
          </span>
        );
      case 'BLOCKED':
        return (
          <span className="text-red-600 dark:text-red-400 text-xs font-bold flex items-center gap-1.5">
            <Ban size={12} /> Đã chặn
          </span>
        );
      case 'REJECTED':
        return (
          <span className="text-red-600 dark:text-red-400 text-xs font-bold flex items-center gap-1.5">
            <X size={12} /> Đã từ chối
          </span>
        );
      default:
        return status;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header + Button thêm */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">Quản lý đội ngũ</h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
            Gửi lời mời và quản lý nhân sự
          </p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          disabled={loading}
          className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-5 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 shadow-lg shadow-blue-500/30 transition-all active:scale-95 disabled:opacity-60"
        >
          <UserPlus size={18} /> Mời nhân viên
        </button>
      </div>

      {/* Search */}
      <div className="bg-white/60 dark:bg-slate-800/40 backdrop-blur-xl p-4 rounded-2xl border border-white/20 dark:border-slate-700 shadow-lg">
        <div className="relative group max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors" size={20} />
          <input
            type="text"
            placeholder="Tìm theo tên hoặc email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-3 bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/50 outline-none dark:text-white"
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white/60 dark:bg-slate-800/40 backdrop-blur-xl rounded-2xl border border-white/20 dark:border-slate-700 shadow-lg overflow-hidden">
        {loading && <div className="p-8 text-center">Đang tải...</div>}
        {error && <div className="p-6 text-red-600 text-center">{error}</div>}

        {!loading && !error && (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead className="bg-slate-50/50 dark:bg-slate-900/20">
                <tr>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Nhân viên</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Vai trò</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Trạng thái</th>
                  <th className="px-6 py-4 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
                {filteredEmployees.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-10 text-center text-slate-500 dark:text-slate-400">
                      Chưa có nhân viên nào
                    </td>
                  </tr>
                ) : (
                  filteredEmployees.map((emp) => (
                    <tr key={emp._id} className="hover:bg-blue-50/30 dark:hover:bg-blue-900/10 transition-colors group">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <img
                            src={emp.avatar || `https://i.pravatar.cc/150?u=${emp.email}`}
                            alt={emp.fullName}
                            className="w-10 h-10 rounded-full border-2 border-white dark:border-slate-700 shadow-sm"
                          />
                          <div>
                            <span className="block font-bold text-slate-900 dark:text-white">{emp.fullName}</span>
                            <span className="text-xs text-slate-500 dark:text-slate-400">{emp.email}</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">{getRoleBadge(emp.role)}</td>
                      <td className="px-6 py-4">{getStatusDisplay(emp.status)}</td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {emp.role !== 'manager' && (
                            <button
                              onClick={() => toggleBlock(emp._id, emp.status !== 'BLOCKED')}
                              className={`p-2 rounded-lg transition-all ${
                                emp.status === 'BLOCKED'
                                  ? 'text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/20'
                                  : 'text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-900/20'
                              }`}
                              title={emp.status === 'BLOCKED' ? 'Mở chặn' : 'Chặn'}
                            >
                              {emp.status === 'BLOCKED' ? <ShieldCheck size={18} /> : <Ban size={18} />}
                            </button>
                          )}

                          <button
                            onClick={() => deleteEmployee(emp._id)}
                            className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all"
                            title="Xóa nhân viên"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal mời nhân viên */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-white dark:bg-slate-800 rounded-3xl w-full max-w-md p-8 shadow-2xl border border-white/20 relative"
            >
              <button
                onClick={() => setIsModalOpen(false)}
                className="absolute top-6 right-6 p-2 text-slate-400 hover:text-slate-600"
              >
                <X size={20} />
              </button>

              <div className="mb-8">
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Mời nhân viên mới</h2>
                <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
                  Nhân viên sẽ nhận email chứa link để kích hoạt tài khoản.
                </p>
              </div>

              {error && <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-xl text-sm">{error}</div>}

              <form onSubmit={handleInviteEmployee} className="space-y-5">
                <div className="space-y-1.5">
                  <label className="text-sm font-bold text-slate-700 dark:text-slate-300">Họ tên</label>
                  <input
                    required
                    type="text"
                    value={formData.fullName}
                    onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 p-3.5 text-sm dark:text-white"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-bold text-slate-700 dark:text-slate-300">Email</label>
                  <input
                    required
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 p-3.5 text-sm dark:text-white"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-bold text-slate-700 dark:text-slate-300">Số điện thoại (tùy chọn)</label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 p-3.5 text-sm dark:text-white"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-bold text-slate-700 dark:text-slate-300">Chức vụ</label>
                  <div className="grid grid-cols-2 gap-2">
                    {(['frontdesk', 'technician', 'storekeeper'] as const).map((r) => (
                      <button
                        key={r}
                        type="button"
                        onClick={() => setFormData({ ...formData, role: r })}
                        className={`py-2.5 rounded-xl text-xs font-bold border transition-all capitalize
                          ${formData.role === r
                            ? 'bg-blue-600 border-blue-600 text-white'
                            : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'}`}
                      >
                        {r === 'frontdesk' ? 'Lễ tân' : r === 'technician' ? 'Kỹ thuật' : 'Kho'}
                      </button>
                    ))}
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-xl mt-4 shadow-xl shadow-blue-500/30 transition-all disabled:opacity-60"
                >
                  {loading ? 'Đang gửi lời mời...' : 'Gửi lời mời & Chờ kích hoạt'}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};