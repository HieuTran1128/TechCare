import React, { useState, useEffect } from 'react';
import { Smartphone, User, Phone, AlertCircle, Plus, Search, ClipboardList, CheckCircle2, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';

// Cấu hình axios interceptor để tự động gắn token
axios.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
      console.log('--- Axios gửi request ---');
      console.log('URL:', config.url);
      console.log('Token đầu 50 ký tự:', token.slice(0, 50));
      console.log('Token cuối 50 ký tự:', token.slice(-50));
    } else {
      console.log('KHÔNG CÓ TOKEN TRONG LOCALSTORAGE!');
    }
    return config;
  },
  (error) => Promise.reject(error)
);

interface Ticket {
  _id: string;
  ticketCode: string;
  device: { brand: string; model: string; deviceType: string };
  initialIssue: string;
  status: string;
  createdAt: string;
  customerName?: string;
}

const API_BASE = 'http://localhost:3000/api'; // ← PORT BACKEND ĐÚNG (thường là 3000, không phải 3000)

export const ReceptionistBoard: React.FC = () => {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [isLoadingTickets, setIsLoadingTickets] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  const [formData, setFormData] = useState({
    customerName: '',
    customerPhone: '',
    customerEmail: '',
    deviceType: '',
    brand: '',
    model: '',
    issue: '',
    priority: 'medium' as 'low' | 'medium' | 'high',
  });

  // Load danh sách ticket mới nhất
  useEffect(() => {
    const fetchTickets = async () => {
      try {
        setIsLoadingTickets(true);
        const res = await axios.get(`${API_BASE}/ticket?limit=6&sort=-createdAt`);
        setTickets(res.data.data || res.data || []);
      } catch (err: any) {
        console.error('Lỗi tải danh sách ticket:', err);
        // Không set error UI để tránh crash, chỉ log
      } finally {
        setIsLoadingTickets(false);
      }
    };

    fetchTickets();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    setIsSubmitting(true);
    setSubmitError(null);
    setSubmitSuccess(false);

    try {
      let customerId: string;

      try {
        const checkRes = await axios.get(`${API_BASE}/customers?email=${encodeURIComponent(formData.customerEmail.trim())}`);
        if (checkRes.data.length > 0) {
          const existing = checkRes.data[0];
          customerId = existing._id;
          console.log('Tái sử dụng khách hàng cũ theo email:', customerId);
        } else {
          // Tạo mới 
          const customerRes = await axios.post(`${API_BASE}/customers`, {
            fullName: formData.customerName.trim(),
            phone: formData.customerPhone.trim(),
            email: formData.customerEmail.trim(),
          });
          customerId = customerRes.data._id;
        }
      } catch (checkErr: any) {
        console.warn('Không tìm thấy API check email, tạo mới customer:', checkErr.message);
        const customerRes = await axios.post(`${API_BASE}/customers`, {
          fullName: formData.customerName.trim(),
          phone: formData.customerPhone.trim(),
          email: formData.customerEmail.trim(),
        });
        customerId = customerRes.data._id;
      }

      const deviceRes = await axios.post(`${API_BASE}/devices`, {
        customerId,
        deviceType: formData.deviceType.trim(),
        brand: formData.brand.trim(),
        model: formData.model.trim(),
      });
      const deviceId = deviceRes.data._id;

      const ticketRes = await axios.post(`${API_BASE}/ticket`, {
        deviceId,
        initialIssue: formData.issue.trim(),
      });

      // Cập nhật danh sách
      const newTicket = ticketRes.data;
      setTickets([newTicket, ...tickets.slice(0, 5)]);

      setSubmitSuccess(true);
      setFormData({
        customerName: '',
        customerPhone: '',
        customerEmail: '',
        deviceType: '',
        brand: '',
        model: '',
        issue: '',
        priority: 'medium',
      });

      setTimeout(() => setSubmitSuccess(false), 4000);
    } catch (err: any) {
      let msg = 'Có lỗi xảy ra khi tạo phiếu. Vui lòng thử lại.';
      if (err.response) {
        if (err.response.status === 401) {
          msg = 'Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại.';
        } else if (err.response.status === 409) {
          msg = 'Số điện thoại hoặc thiết bị đã tồn tại.';
        } else {
          msg = err.response.data?.message || msg;
        }
      }
      setSubmitError(msg);
      console.error('Lỗi tạo phiếu:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* Form tiếp nhận */}
      <div className="lg:col-span-1 space-y-6">
        <div className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-xl p-8 rounded-3xl border border-white/20 dark:border-slate-700 shadow-xl">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-blue-500/30">
              <Plus size={24} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">Tiếp nhận mới</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">Nhập thông tin khách hàng và máy</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Các field input giữ nguyên như cũ, chỉ thêm required và trim ở handleSubmit */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-500 uppercase flex items-center gap-2 px-1">
                <User size={12} /> Tên khách hàng
              </label>
              <input
                required
                type="text"
                placeholder="VD: Anh Tuấn"
                className="w-full bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm dark:text-white focus:ring-2 focus:ring-blue-500 transition-all outline-none"
                value={formData.customerName}
                onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-500 uppercase flex items-center gap-2 px-1">
                <Phone size={12} /> Số điện thoại
              </label>
              <input
                required
                type="tel"
                placeholder="090x xxx xxx"
                className="w-full bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm dark:text-white focus:ring-2 focus:ring-blue-500 transition-all outline-none"
                value={formData.customerPhone}
                onChange={(e) => setFormData({ ...formData, customerPhone: e.target.value })}
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-500 uppercase flex items-center gap-2 px-1">
                <AlertCircle size={12} /> Email (bắt buộc)
              </label>
              <input
                required
                type="email"
                placeholder="email@khach.com"
                className="w-full bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm dark:text-white focus:ring-2 focus:ring-blue-500 transition-all outline-none"
                value={formData.customerEmail}
                onChange={(e) => setFormData({ ...formData, customerEmail: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase flex items-center gap-2 px-1">
                  <Smartphone size={12} /> Loại
                </label>
                <input
                  required
                  placeholder="Điện thoại, Laptop..."
                  className="w-full bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-3 text-sm dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                  value={formData.deviceType}
                  onChange={(e) => setFormData({ ...formData, deviceType: e.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase">Hãng</label>
                <input
                  required
                  placeholder="Apple, Samsung..."
                  className="w-full bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-3 text-sm dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                  value={formData.brand}
                  onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase">Model</label>
                <input
                  required
                  placeholder="iPhone 14 Pro..."
                  className="w-full bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-3 text-sm dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                  value={formData.model}
                  onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-500 uppercase flex items-center gap-2 px-1">
                <AlertCircle size={12} /> Tình trạng máy
              </label>
              <textarea
                required
                rows={3}
                placeholder="VD: Vỡ màn hình, cảm ứng bình thường..."
                className="w-full bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm dark:text-white focus:ring-2 focus:ring-blue-500 transition-all outline-none resize-none"
                value={formData.issue}
                onChange={(e) => setFormData({ ...formData, issue: e.target.value })}
              />
            </div>

            <div className="pt-4">
              <button
                type="submit"
                disabled={isSubmitting}
                className={`w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold py-4 rounded-2xl shadow-lg shadow-blue-500/30 hover:shadow-blue-500/50 transition-all active:scale-95 flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed`}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 size={20} className="animate-spin" /> Đang xử lý...
                  </>
                ) : (
                  <>
                    <ClipboardList size={20} /> Tạo phiếu biên nhận
                  </>
                )}
              </button>
            </div>

            <AnimatePresence>
              {submitSuccess && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="mt-4 p-3 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 text-sm font-bold rounded-xl flex items-center justify-center gap-2 border border-emerald-100 dark:border-emerald-800"
                >
                  <CheckCircle2 size={18} /> Đã tạo phiếu thành công!
                </motion.div>
              )}

              {submitError && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="mt-4 p-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm rounded-xl border border-red-100 dark:border-red-800"
                >
                  {submitError}
                </motion.div>
              )}
            </AnimatePresence>
          </form>
        </div>
      </div>

      {/* Danh sách ticket */}
      <div className="lg:col-span-2 space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <ClipboardList className="text-blue-500" /> Đơn mới tiếp nhận
          </h2>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input
              type="text"
              placeholder="Tìm phiếu..."
              className="pl-10 pr-4 py-2 bg-white/50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-full text-xs outline-none focus:border-blue-500 dark:text-white"
            />
          </div>
        </div>

        {isLoadingTickets ? (
          <div className="flex justify-center items-center h-64">
            <Loader2 className="animate-spin text-blue-500" size={40} />
          </div>
        ) : tickets.length === 0 ? (
          <div className="text-center text-slate-500 dark:text-slate-400 py-10">
            Chưa có phiếu sửa chữa nào
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {tickets.map((ticket, idx) => (
              <motion.div
                key={ticket._id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: idx * 0.05 }}
                className="bg-white/40 dark:bg-slate-800/40 backdrop-blur-md p-5 rounded-2xl border border-white/20 dark:border-slate-700 shadow-sm hover:shadow-md transition-all group"
              >
                <div className="flex justify-between items-start mb-4">
                  <div className="bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 p-2 rounded-lg group-hover:scale-110 transition-transform">
                    <Smartphone size={20} />
                  </div>
                  <span className="text-[10px] font-mono font-black text-slate-400 dark:text-slate-500 bg-slate-50 dark:bg-slate-900 px-2 py-1 rounded">
                    {ticket.ticketCode || ticket._id.slice(-6).toUpperCase()}
                  </span>
                </div>

                <h3 className="font-bold text-slate-900 dark:text-white mb-1">
                  {ticket.device?.brand} {ticket.device?.model} ({ticket.device?.deviceType})
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-1 mb-4">{ticket.initialIssue}</p>

                <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-700">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-slate-200 flex items-center justify-center text-[10px] font-bold text-slate-600 uppercase">
                      {ticket.customerName?.charAt(0) || '?'}
                    </div>
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                      {ticket.customerName || 'Khách hàng'}
                    </span>
                  </div>
                  <span className="text-[10px] font-medium text-slate-400">
                    {new Date(ticket.createdAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};