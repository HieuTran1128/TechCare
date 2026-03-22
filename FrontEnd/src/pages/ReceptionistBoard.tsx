import React, { useEffect, useMemo, useRef, useState } from 'react';
import axios from 'axios';
import { motion } from 'framer-motion';
import { CircleCheckBig, Clock3, Phone, Search, TicketPlus, UserRound } from 'lucide-react';

interface Ticket {
  _id: string;
  ticketCode: string;
  initialIssue: string;
  status: string;
  createdAt: string;
  device?: { brand: string; model: string; deviceType: string; customer?: { fullName: string } };
}

const statusLabels: Record<string, string> = {
  COMPLETED: 'Hoàn thành',
  REJECTED: 'Từ chối',
  PENDING: 'Đang chờ',
  IN_PROGRESS: 'Đang xử lý',
  CANCELLED: 'Đã hủy',
  DIAGNOSING: 'Kỹ thuật kiểm tra',
  WAITING_INVENTORY: 'Chờ kho duyệt',
  INVENTORY_APPROVED: 'Kho đã duyệt',
  INVENTORY_REJECTED: 'Kho từ chối',
  QUOTED: 'Đã gửi báo giá',
  CUSTOMER_APPROVED: 'Khách đồng ý',
  CUSTOMER_REJECTED: 'Khách từ chối',
  RECEIVED: 'Tiếp nhận',
  MANAGER_ASSIGNED: 'Quản lý phân công',
  DONE_INVENTORY_REJECTED: 'Kho từ chối',
};

const statusColorClasses: Record<string, string> = {
  RECEIVED: 'bg-blue-100 text-blue-700',
  MANAGER_ASSIGNED: 'bg-indigo-100 text-indigo-700',
  DIAGNOSING: 'bg-violet-100 text-violet-700',
  WAITING_INVENTORY: 'bg-amber-100 text-amber-700',
  INVENTORY_APPROVED: 'bg-emerald-100 text-emerald-700',
  INVENTORY_REJECTED: 'bg-rose-100 text-rose-700',
  QUOTED: 'bg-cyan-100 text-cyan-700',
  CUSTOMER_APPROVED: 'bg-teal-100 text-teal-700',
  CUSTOMER_REJECTED: 'bg-red-100 text-red-700',
  IN_PROGRESS: 'bg-purple-100 text-purple-700',
  COMPLETED: 'bg-green-100 text-green-700',
  REJECTED: 'bg-red-100 text-red-700',
  CANCELLED: 'bg-slate-200 text-slate-700',
  PENDING: 'bg-yellow-100 text-yellow-700',
  DONE_INVENTORY_REJECTED: 'bg-red-100 text-red-700',
};

interface Customer {
  _id: string;
  fullName: string;
  phone: string;
  email?: string;
}

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api';

export const ReceptionistBoard: React.FC = () => {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const suggestionBoxRef = useRef<HTMLDivElement | null>(null);

  const [form, setForm] = useState({
    customerName: '',
    customerPhone: '',
    customerEmail: '',
    deviceType: '',
    brand: '',
    model: '',
    issue: '',
  });

  const loadTickets = async () => {
    try {
      const res = await axios.get(`${API_BASE}/ticket?limit=10&sort=-createdAt`, { withCredentials: true });
      setTickets(res.data.data || []);
    } catch {
      setTickets([]);
    }
  };

  const loadCustomers = async () => {
    try {
      const res = await axios.get(`${API_BASE}/customers`, { withCredentials: true });
      setCustomers(res.data || []);
    } catch {
      setCustomers([]);
    }
  };

  useEffect(() => {
    loadTickets();
    loadCustomers();
  }, []);

  useEffect(() => {
    const onClickOutside = (event: MouseEvent) => {
      if (!suggestionBoxRef.current) return;
      if (!suggestionBoxRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, []);

  const suggestions = useMemo(() => {
    const phone = form.customerPhone.trim();
    const email = form.customerEmail.trim().toLowerCase();

    if (!phone && !email) return [];

    return customers
      .filter((c) => {
        const byPhone = phone ? c.phone?.includes(phone) : false;
        const byEmail = email ? c.email?.toLowerCase().includes(email) : false;
        return byPhone || byEmail;
      })
      .slice(0, 6);
  }, [customers, form.customerPhone, form.customerEmail]);

  const applyCustomer = (c: Customer) => {
    setForm((prev) => ({
      ...prev,
      customerName: c.fullName || '',
      customerPhone: c.phone || '',
      customerEmail: c.email || '',
    }));
    setShowSuggestions(false);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      const byPhone = customers.find((c: Customer) => c.phone === form.customerPhone.trim());
      const byEmail = customers.find((c: Customer) => c.email?.toLowerCase() === form.customerEmail.trim().toLowerCase());
      const found = byPhone || byEmail;

      let customerId = found?._id;

      if (!customerId) {
        const newCustomer = await axios.post(
          `${API_BASE}/customers`,
          {
            fullName: form.customerName.trim(),
            phone: form.customerPhone.trim(),
            email: form.customerEmail.trim(),
          },
          { withCredentials: true },
        );
        customerId = newCustomer.data._id;
      } else {
        await axios.patch(
          `${API_BASE}/customers/${customerId}`,
          {
            fullName: form.customerName.trim(),
            phone: form.customerPhone.trim(),
            email: form.customerEmail.trim(),
          },
          { withCredentials: true },
        );
      }

      const device = await axios.post(
        `${API_BASE}/devices`,
        {
          customerId,
          deviceType: form.deviceType.trim(),
          brand: form.brand.trim(),
          model: form.model.trim(),
        },
        { withCredentials: true },
      );

      await axios.post(
        `${API_BASE}/ticket`,
        {
          deviceId: device.data._id,
          initialIssue: form.issue.trim(),
        },
        { withCredentials: true },
      );

      setMessage('Tạo phiếu thành công. Quản lý sẽ phân công kỹ thuật viên.');
      setForm({
        customerName: '',
        customerPhone: '',
        customerEmail: '',
        deviceType: '',
        brand: '',
        model: '',
        issue: '',
      });
      setShowSuggestions(false);
      loadTickets();
      loadCustomers();
    } catch (err: any) {
      const backendMsg = err.response?.data?.message;
      if (backendMsg === 'EMAIL_ALREADY_EXISTS') {
        setMessage('Email đã tồn tại ở khách hàng khác. Vui lòng nhập đúng email/SĐT của khách cũ hoặc dùng email mới.');
      } else if (backendMsg === 'CUSTOMER_ALREADY_EXISTS') {
        setMessage('Số điện thoại đã tồn tại. Hệ thống sẽ dùng hồ sơ khách hàng cũ.');
      } else {
        setMessage(backendMsg || 'Tạo phiếu thất bại');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-4">
          <div className="flex items-center justify-between">
            <p className="text-xs uppercase text-slate-500 tracking-wider">Đơn mới</p>
            <TicketPlus size={16} className="text-indigo-600" />
          </div>
          <p className="text-2xl font-extrabold mt-2">{tickets.length}</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-4">
          <div className="flex items-center justify-between">
            <p className="text-xs uppercase text-slate-500 tracking-wider">Khách hàng đã lưu</p>
            <UserRound size={16} className="text-emerald-600" />
          </div>
          <p className="text-2xl font-extrabold mt-2">{customers.length}</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-4">
          <div className="flex items-center justify-between">
            <p className="text-xs uppercase text-slate-500 tracking-wider">Phiếu hoàn thành</p>
            <CircleCheckBig size={16} className="text-sky-600" />
          </div>
          <p className="text-2xl font-extrabold mt-2">{tickets.filter((t) => t.status === 'COMPLETED').length}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <section className="lg:col-span-1 bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
          <h2 className="font-bold text-lg mb-4">Tiếp nhận khách hàng</h2>
          <form onSubmit={submit} className="space-y-3">
            <input
              required
              placeholder="Tên khách hàng"
              value={form.customerName}
              onChange={(e) => setForm({ ...form, customerName: e.target.value })}
              className="w-full border border-slate-200 rounded-xl px-3 py-2.5 bg-white"
            />

            <div className="relative" ref={suggestionBoxRef}>
              <div className="relative">
                <Phone size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  required
                  placeholder="Số điện thoại"
                  value={form.customerPhone}
                  onFocus={() => setShowSuggestions(true)}
                  onChange={(e) => {
                    setForm({ ...form, customerPhone: e.target.value });
                    setShowSuggestions(true);
                  }}
                  className="w-full border border-slate-200 rounded-xl pl-9 pr-3 py-2.5 bg-white"
                />
              </div>

              {showSuggestions && suggestions.length > 0 && (
                <div className="mt-1 w-full bg-white border border-slate-200 rounded-xl shadow-lg max-h-56 overflow-auto">
                  {suggestions.map((c) => (
                    <button
                      type="button"
                      key={c._id}
                      onClick={() => applyCustomer(c)}
                      className="w-full text-left px-3 py-2.5 hover:bg-slate-50 border-b border-slate-100 last:border-b-0"
                    >
                      <p className="font-medium text-sm">{c.fullName}</p>
                      <p className="text-xs text-slate-500">{c.phone} {c.email ? `• ${c.email}` : ''}</p>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <input
              required
              placeholder="Email"
              value={form.customerEmail}
              onFocus={() => setShowSuggestions(true)}
              onChange={(e) => {
                setForm({ ...form, customerEmail: e.target.value });
                setShowSuggestions(true);
              }}
              className="w-full border border-slate-200 rounded-xl px-3 py-2.5 bg-white"
            />

            <div className="grid grid-cols-2 gap-3">
              <input
                required
                placeholder="Loại máy"
                value={form.deviceType}
                onChange={(e) => setForm({ ...form, deviceType: e.target.value })}
                className="w-full border border-slate-200 rounded-xl px-3 py-2.5 bg-white"
              />
              <input
                required
                placeholder="Hãng"
                value={form.brand}
                onChange={(e) => setForm({ ...form, brand: e.target.value })}
                className="w-full border border-slate-200 rounded-xl px-3 py-2.5 bg-white"
              />
            </div>

            <input
              placeholder="Model"
              value={form.model}
              onChange={(e) => setForm({ ...form, model: e.target.value })}
              className="w-full border border-slate-200 rounded-xl px-3 py-2.5 bg-white"
            />

            <textarea
              required
              placeholder="Mô tả lỗi ban đầu"
              value={form.issue}
              onChange={(e) => setForm({ ...form, issue: e.target.value })}
              className="w-full border border-slate-200 rounded-xl px-3 py-2.5 bg-white h-24"
            />

            <button disabled={loading} className="w-full bg-gradient-to-r from-indigo-600 to-violet-600 text-white py-2.5 rounded-xl font-semibold hover:opacity-95 disabled:opacity-60">
              {loading ? 'Đang tạo...' : 'Tạo phiếu'}
            </button>
            {message && <p className="text-sm text-slate-600">{message}</p>}
          </form>
        </section>

        <section className="lg:col-span-2 bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-lg">Đơn mới tiếp nhận</h2>
            <div className="text-xs text-slate-500 inline-flex items-center gap-1"><Clock3 size={13} /> Mới nhất 10 đơn</div>
          </div>

          <div className="overflow-x-auto rounded-xl border border-slate-100">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-slate-600">
                <tr>
                  <th className="text-left px-3 py-2.5">Mã phiếu</th>
                  <th className="text-left px-3 py-2.5">Khách hàng</th>
                  <th className="text-left px-3 py-2.5">Thiết bị</th>
                  <th className="text-left px-3 py-2.5">Mô tả lỗi</th>
                  <th className="text-left px-3 py-2.5">Trạng thái</th>
                  <th className="text-left px-3 py-2.5">Thời gian</th>
                </tr>
              </thead>
              <tbody>
                {tickets.map((t, idx) => (
                  <motion.tr
                    key={t._id}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.03 }}
                    className="border-t border-slate-100 hover:bg-slate-50/60"
                  >
                    <td className="px-3 py-2.5 font-semibold text-slate-800">{t.ticketCode}</td>
                    <td className="px-3 py-2.5">{t.device?.customer?.fullName || 'N/A'}</td>
                    <td className="px-3 py-2.5">{t.device?.brand} {t.device?.model}</td>
                    <td className="px-3 py-2.5 max-w-[260px] truncate">{t.initialIssue}</td>
                    <td className="px-3 py-2.5">
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${statusColorClasses[t.status] || 'bg-slate-100 text-slate-700'}`}>
                        {statusLabels[t.status] || t.status}
                      </span>
                    </td>
                    <td className="px-3 py-2.5 text-slate-500">{new Date(t.createdAt).toLocaleString('vi-VN')}</td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-3 text-xs text-slate-500 inline-flex items-center gap-1">
            <Search size={12} />
            Gợi ý khách hàng tự động khi nhập số điện thoại/email.
          </div>
        </section>
      </div>
    </div>
  );
};