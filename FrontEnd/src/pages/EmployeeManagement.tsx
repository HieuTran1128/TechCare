import React, { useState, useEffect, useRef } from 'react';
import { UserPlus, Search, Trash2, Clock, X, Ban, ShieldCheck, FileSpreadsheet } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import * as XLSX from 'xlsx';

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

const API_BASE = '/api'; // dùng proxy của Vite để tránh 404

export const EmployeeManagement: React.FC = () => {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    role: 'technician' as Employee['role'],
  });

  const [bulkErrors, setBulkErrors] = useState<string[]>([]);
  const [bulkStaffList, setBulkStaffList] = useState([
    { fullName: '', email: '', phone: '', role: 'technician' as Employee['role'] }
  ]);
  const excelInputRef = useRef<HTMLInputElement>(null);

  const roleMap: Record<string, Employee['role']> = {
    'lễ tân': 'frontdesk', 'le tan': 'frontdesk', 'frontdesk': 'frontdesk',
    'kỹ thuật': 'technician', 'ky thuat': 'technician', 'technician': 'technician', 'kỹ thuật viên': 'technician',
    'kho': 'storekeeper', 'thủ kho': 'storekeeper', 'storekeeper': 'storekeeper',
  };

  const handleImportExcel = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      const data = evt.target?.result;
      const workbook = XLSX.read(data, { type: 'binary' });
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const rows: any[] = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' });

      // Bỏ qua dòng header (dòng đầu tiên)
      const dataRows = rows.slice(1).filter((row: any[]) => row.some((cell) => String(cell).trim() !== ''));

      if (dataRows.length === 0) {
        setBulkErrors(['File Excel không có dữ liệu hoặc sai định dạng']);
        return;
      }

      const imported = dataRows.map((row: any[]) => {
        const rawRole = String(row[3] ?? '').trim().toLowerCase();
        const mappedRole = roleMap[rawRole] ?? 'technician';
        return {
          fullName: String(row[0] ?? '').trim(),
          email: String(row[1] ?? '').trim(),
          phone: String(row[2] ?? '').trim(),
          role: mappedRole,
        };
      });

      setBulkStaffList((prev) => {
        // Nếu chỉ có 1 dòng trống thì thay thế, ngược lại append
        const isEmpty = prev.length === 1 && !prev[0].fullName && !prev[0].email && !prev[0].phone;
        return isEmpty ? imported : [...prev, ...imported];
      });
      setBulkErrors([]);
    };
    reader.readAsBinaryString(file);
    // Reset input để có thể import lại cùng file
    e.target.value = '';
  };

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

  const handleBulkInvite = async () => {
    setLoading(true);
    setError(null);
    setBulkErrors([]);

    try {
      const staffList = bulkStaffList
        .map((item) => ({
          fullName: item.fullName.trim(),
          email: item.email.trim(),
          phone: item.phone.trim(),
          role: item.role,
        }))
        .filter((item) => item.fullName || item.email || item.phone || item.role);

      if (staffList.length === 0) {
        setBulkErrors(['Danh sách không được để trống']);
        setLoading(false);
        return;
      }

      const invalidRow = staffList.findIndex((item) => !item.fullName || !item.email || !item.role);
      if (invalidRow !== -1) {
        setBulkErrors([`Dòng ${invalidRow + 1} thiếu thông tin bắt buộc`]);
        setLoading(false);
        return;
      }

      const res = await axios.post(
        `${API_BASE}/users/invite-bulk`,
        { staffList: staffList.map((item) => ({ ...item, phone: item.phone || undefined })) },
        { withCredentials: true }
      );

      const results = res.data.results || [];
      const skipped = results.filter((item: any) => item.status !== 'CREATED');
      if (skipped.length > 0) {
        setBulkErrors(
          skipped.map((item: any) => `Email ${item.email}: ${item.reason === 'EMAIL_EXISTS' ? 'đã tồn tại' : 'chức vụ không hợp lệ'}`)
        );
      }

      await fetchEmployees();
      setBulkStaffList([{ fullName: '', email: '', phone: '', role: 'technician' }]);
      setIsBulkModalOpen(false);
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || 'Có lỗi xảy ra khi tạo hàng loạt';
      setBulkErrors([msg]);
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

  const addBulkRow = () => {
    setBulkStaffList((prev) => ([
      ...prev,
      { fullName: '', email: '', phone: '', role: 'technician' },
    ]));
  };

  const removeBulkRow = (index: number) => {
    setBulkStaffList((prev) => prev.filter((_, idx) => idx !== index));
  };

  const updateBulkRow = (index: number, field: 'fullName' | 'email' | 'phone' | 'role', value: string) => {
    setBulkStaffList((prev) =>
      prev.map((row, idx) => (idx === index ? { ...row, [field]: value } : row))
    );
  };

  return (
    <div className="space-y-6">
      {/* Header + Button thêm */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setIsModalOpen(true)}
            disabled={loading}
            className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-5 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 shadow-lg shadow-blue-500/30 transition-all active:scale-95 disabled:opacity-60"
          >
            <UserPlus size={18} /> Mời nhân viên
          </button>
          <button
            onClick={() => {
              setBulkErrors([]);
              setIsBulkModalOpen(true);
            }}
            disabled={loading}
            className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white px-5 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 shadow-lg shadow-emerald-500/30 transition-all active:scale-95 disabled:opacity-60"
          >
            <UserPlus size={18} /> Mời nhân viên hàng loạt
          </button>
        </div>
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

      {/* Modal mời nhân viên hàng loạt */}
      <AnimatePresence>
        {isBulkModalOpen && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-white dark:bg-slate-800 rounded-3xl w-full max-w-3xl p-8 shadow-2xl border border-white/20 relative"
            >
              <button
                onClick={() => setIsBulkModalOpen(false)}
                className="absolute top-6 right-6 p-2 text-slate-400 hover:text-slate-600"
              >
                <X size={20} />
              </button>

              <div className="mb-6">
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Mời nhân viên hàng loạt</h2>
                <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
                  Thêm nhiều dòng nhân viên. Mỗi dòng sẽ gửi mật khẩu qua email.
                </p>
              </div>
              <input
                ref={excelInputRef}
                type="file"
                accept=".xlsx,.xls"
                className="hidden"
                onChange={handleImportExcel}
              />

              {bulkErrors.length > 0 && (
                <div className="mb-4 space-y-1">
                  {bulkErrors.map((item, index) => (
                    <div key={index} className="p-2 bg-red-50 text-red-700 rounded-xl text-xs">
                      {item}
                    </div>
                  ))}
                </div>
              )}

              <div className="space-y-4">
                {bulkStaffList.map((row, index) => (
                  <div key={index} className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-2xl p-4">
                    <div className="md:col-span-3">
                      <label className="text-xs font-bold text-slate-600 dark:text-slate-300">Họ tên</label>
                      <div className="relative mt-1">
                        <input
                          type="text"
                          value={row.fullName}
                          onChange={(e) => updateBulkRow(index, 'fullName', e.target.value)}
                          className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-2.5 pr-8 text-xs dark:text-white"
                        />
                        <span className="absolute right-2 top-1/2 -translate-y-1/2 text-emerald-500 font-bold">+</span>
                      </div>
                    </div>
                    <div className="md:col-span-3">
                      <label className="text-xs font-bold text-slate-600 dark:text-slate-300">Email</label>
                      <div className="relative mt-1">
                        <input
                          type="email"
                          value={row.email}
                          onChange={(e) => updateBulkRow(index, 'email', e.target.value)}
                          className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-2.5 pr-8 text-xs dark:text-white"
                        />
                        <span className="absolute right-2 top-1/2 -translate-y-1/2 text-emerald-500 font-bold">+</span>
                      </div>
                    </div>
                    <div className="md:col-span-2">
                      <label className="text-xs font-bold text-slate-600 dark:text-slate-300">Số điện thoại</label>
                      <div className="relative mt-1">
                        <input
                          type="tel"
                          value={row.phone}
                          onChange={(e) => updateBulkRow(index, 'phone', e.target.value)}
                          className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-2.5 pr-8 text-xs dark:text-white"
                        />
                        <span className="absolute right-2 top-1/2 -translate-y-1/2 text-emerald-500 font-bold">+</span>
                      </div>
                    </div>
                    <div className="md:col-span-3">
                      <label className="text-xs font-bold text-slate-600 dark:text-slate-300">Chức vụ</label>
                      <div className="mt-1 grid grid-cols-3 gap-1">
                        {(['frontdesk', 'technician', 'storekeeper'] as const).map((role) => (
                          <button
                            key={role}
                            type="button"
                            onClick={() => updateBulkRow(index, 'role', role)}
                            className={`py-2 rounded-lg text-[10px] font-bold border transition-all capitalize
                              ${row.role === role
                                ? 'bg-emerald-600 border-emerald-600 text-white'
                                : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'}`}
                          >
                            {role === 'frontdesk' ? 'Lễ tân' : role === 'technician' ? 'Kỹ thuật' : 'Kho'}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div className="md:col-span-1 flex items-center justify-end gap-2">
                      <button
                        type="button"
                        onClick={addBulkRow}
                        className="h-10 w-10 rounded-xl border border-emerald-200 text-emerald-600 hover:bg-emerald-50 dark:border-emerald-800 dark:text-emerald-400 dark:hover:bg-emerald-900/30"
                        title="Thêm dòng"
                      >
                        +
                      </button>
                      {bulkStaffList.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeBulkRow(index)}
                          className="h-10 w-10 rounded-xl border border-red-200 text-red-500 hover:bg-red-50 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-900/30"
                          title="Xóa dòng"
                        >
                          -
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex flex-col sm:flex-row gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => excelInputRef.current?.click()}
                  className="sm:w-1/3 bg-white dark:bg-slate-900 border border-emerald-200 dark:border-emerald-800 text-emerald-600 dark:text-emerald-400 font-bold py-3 rounded-xl flex items-center justify-center gap-2"
                >
                  <FileSpreadsheet size={16} /> Import Excel
                </button>
                <button
                  type="button"
                  onClick={handleBulkInvite}
                  disabled={loading}
                  className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 rounded-xl shadow-lg shadow-emerald-500/30 transition-all disabled:opacity-60"
                >
                  {loading ? 'Đang tạo tài khoản...' : 'Tạo tài khoản & Gửi mật khẩu'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};