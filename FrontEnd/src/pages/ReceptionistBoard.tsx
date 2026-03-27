import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import axios from 'axios';
import { motion } from 'framer-motion';
import { CircleCheckBig, Clock3, CreditCard, Phone, Search, TicketPlus, UserRound, Wallet } from 'lucide-react';

interface Ticket {
  _id: string;
  ticketCode: string;
  initialIssue: string;
  status: string;
  finalCost?: number;
  createdAt: string;
  payment?: {
    method?: 'CASH' | 'PAYOS';
    status?: 'PENDING' | 'PAID';
    paidAt?: string;
    payosCheckoutUrl?: string;
  };
  device?: { brand: string; model: string; deviceType: string; customer?: { fullName: string } };
}

const statusLabels: Record<string, string> = {
  COMPLETED: 'Hoàn thành',
  PAYMENTED: 'Đã thanh toán',
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
  WARRANTY_DONE: 'Bảo hành xong',
  WARRANTY_IN_PROGRESS: 'Đang bảo hành',
  WARRANTY_COMPLETED: 'Bảo hành hoàn thành',
  WARRANTY_CANCELLED: 'Bảo hành hủy',
  WARRANTY_REJECTED: 'Bảo hành từ chối',
  WARRANTY_PAID: 'Bảo hành đã thanh toán',
  WARRANTY_PENDING: 'Bảo hành đang chờ',
  WARRANTY_WAITING_CUSTOMER_APPROVAL: 'Bảo hành đang chờ khách hàng xác nhận',
  WARRANTY_DONE_INVENTORY_REJECTED: 'Bảo hành kho từ chối',
  WARRANTY_DONE_INVENTORY_APPROVED: 'Bảo hành kho đã duyệt',

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
  PAYMENTED: 'bg-emerald-200 text-emerald-800',
  REJECTED: 'bg-red-100 text-red-700',
  CANCELLED: 'bg-slate-200 text-slate-700',
  PENDING: 'bg-yellow-100 text-yellow-700',
  DONE_INVENTORY_REJECTED: 'bg-red-100 text-red-700',
  WARRANTY_DONE: 'bg-violet-200 text-violet-800',
  WARRANTY_IN_PROGRESS: 'bg-orange-100 text-orange-800',
  WARRANTY_COMPLETED: 'bg-emerald-100 text-emerald-800',
  WARRANTY_CANCELLED: 'bg-red-100 text-red-800',
  WARRANTY_REJECTED: 'bg-red-100 text-red-800',
  WARRANTY_PAID: 'bg-emerald-100 text-emerald-800',
  WARRANTY_PENDING: 'bg-yellow-100 text-yellow-800',
  WARRANTY_WAITING_CUSTOMER_APPROVAL: 'bg-indigo-100 text-indigo-800',
  WARRANTY_DONE_INVENTORY_REJECTED: 'bg-red-100 text-red-800',
  WARRANTY_DONE_INVENTORY_APPROVED: 'bg-emerald-100 text-emerald-800',
  
};

interface Customer {
  _id: string;
  fullName: string;
  phone: string;
  email?: string;
}

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api';

export const ReceptionistBoard: React.FC = () => {
  const location = useLocation();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const suggestionBoxRef = useRef<HTMLDivElement | null>(null);
  const ticketSuggestionBoxRef = useRef<HTMLDivElement | null>(null);

  const [lookupCode, setLookupCode] = useState('');
  const [lookupLoading, setLookupLoading] = useState(false);
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [foundTicket, setFoundTicket] = useState<Ticket | null>(null);
  const [ticketSuggestions, setTicketSuggestions] = useState<Ticket[]>([]);
  const [showTicketSuggestions, setShowTicketSuggestions] = useState(false);
  const [paymentMessage, setPaymentMessage] = useState('');
  const [cashModalOpen, setCashModalOpen] = useState(false);
  const [cashGiven, setCashGiven] = useState('');

  const [statusFilter, setStatusFilter] = useState('ALL');
  const [ticketPage, setTicketPage] = useState(1);
  const [ticketPageSize, setTicketPageSize] = useState(10);

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
      const res = await axios.get(`${API_BASE}/ticket?limit=100&sort=-updatedAt`, { withCredentials: true });
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
      const target = event.target as Node;

      if (suggestionBoxRef.current && !suggestionBoxRef.current.contains(target)) {
        setShowSuggestions(false);
      }

      if (ticketSuggestionBoxRef.current && !ticketSuggestionBoxRef.current.contains(target)) {
        setShowTicketSuggestions(false);
      }
    };

    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const paymentStatus = params.get('payment');
    const ticketCode = params.get('ticket');

    if (!paymentStatus) return;

    if (paymentStatus === 'success') {
      setPaymentMessage(`Khách đã thanh toán online thành công${ticketCode ? ` cho phiếu ${ticketCode}` : ''}. Bạn có thể tìm lại đơn để kiểm tra trạng thái mới nhất.`);
      if (ticketCode) {
        setLookupCode(ticketCode);
        searchTicketByCode(ticketCode).catch(() => undefined);
      }
    }

    if (paymentStatus === 'cancel') {
      setPaymentMessage(`Khách đã hủy thanh toán online${ticketCode ? ` cho phiếu ${ticketCode}` : ''}.`);
      if (ticketCode) {
        setLookupCode(ticketCode);
      }
    }
  }, [location.search]);

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

  const statusOptions = useMemo(() => {
    const statusSet = new Set<string>(tickets.map((t) => t.status).filter(Boolean));
    return ['ALL', ...Array.from(statusSet)];
  }, [tickets]);

  const filteredTickets = useMemo(() => {
    if (statusFilter === 'ALL') return tickets;
    return tickets.filter((t) => t.status === statusFilter);
  }, [tickets, statusFilter]);

  const ticketTotalPages = Math.max(1, Math.ceil(filteredTickets.length / ticketPageSize));

  const pagedTickets = useMemo(() => {
    const start = (ticketPage - 1) * ticketPageSize;
    return filteredTickets.slice(start, start + ticketPageSize);
  }, [filteredTickets, ticketPage, ticketPageSize]);

  useEffect(() => {
    setTicketPage(1);
  }, [statusFilter, ticketPageSize]);

  useEffect(() => {
    if (ticketPage > ticketTotalPages) {
      setTicketPage(ticketTotalPages);
    }
  }, [ticketPage, ticketTotalPages]);

  const submit = async (e: React.SyntheticEvent<HTMLFormElement>) => {
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
      setForm({ customerName: '', customerPhone: '', customerEmail: '', deviceType: '', brand: '', model: '', issue: '' });
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

  const searchTicketByCode = async (keyword?: string) => {
    const q = (keyword ?? lookupCode).trim();
    if (!q) return;
    setLookupLoading(true);
    setPaymentMessage('');
    setFoundTicket(null);

    try {
      const res = await axios.get(`${API_BASE}/ticket/frontdesk/find-by-code`, {
        params: { ticketCode: q },
        withCredentials: true,
      });
      setFoundTicket(res.data);
      setShowTicketSuggestions(false);
    } catch (err: any) {
      setPaymentMessage(err?.response?.data?.message || 'Không tìm thấy đơn theo mã đã nhập.');
    } finally {
      setLookupLoading(false);
    }
  };

  const searchTicketSuggestions = async (keyword: string) => {
    const q = keyword.trim();
    if (!q || q.length < 2) {
      setTicketSuggestions([]);
      return;
    }

    try {
      const res = await axios.get(`${API_BASE}/ticket/frontdesk/search-by-code`, {
        params: { keyword: q, limit: 8 },
        withCredentials: true,
      });
      setTicketSuggestions(res.data?.data || []);
      setShowTicketSuggestions(true);
    } catch {
      setTicketSuggestions([]);
    }
  };

  const markCashPaid = async () => {
    if (!foundTicket) return;

    const totalCost = Number(foundTicket.finalCost || 0);
    const cash = Number(cashGiven || 0);

    if (!cash || Number.isNaN(cash)) {
      setPaymentMessage('Vui lòng nhập số tiền khách đưa hợp lệ.');
      return;
    }

    if (cash < totalCost) {
      setPaymentMessage('Số tiền khách đưa chưa đủ để thanh toán đơn này.');
      return;
    }

    setPaymentLoading(true);
    setPaymentMessage('');
    try {
      await axios.patch(
        `${API_BASE}/ticket/${foundTicket._id}/payment/mark-paid`,
        { paymentMethod: 'CASH' },
        { withCredentials: true },
      );
      setPaymentMessage('Đã xác nhận thanh toán tiền mặt. Trạng thái đơn chuyển sang PAYMENTED.');
      setCashModalOpen(false);
      setCashGiven('');
      await searchTicketByCode(foundTicket.ticketCode);
      loadTickets();
    } catch (err: any) {
      setPaymentMessage(err?.response?.data?.message || 'Không thể xác nhận thanh toán tiền mặt.');
    } finally {
      setPaymentLoading(false);
    }
  };

  const createPayos = async () => {
    if (!foundTicket) return;
    setPaymentLoading(true);
    setPaymentMessage('');
    try {
      const res = await axios.post(`${API_BASE}/ticket/${foundTicket._id}/payment/payos`, {}, { withCredentials: true });
      window.open(res.data.checkoutUrl, '_blank');
      setPaymentMessage('Đã tạo link thanh toán payOS. Sau khi khách thanh toán, bấm "Xác nhận đã thanh toán online".');
    } catch (err: any) {
      setPaymentMessage(err?.response?.data?.message || 'Không thể tạo thanh toán payOS.');
    } finally {
      setPaymentLoading(false);
    }
  };

  const markPayosPaid = async () => {
    if (!foundTicket) return;
    setPaymentLoading(true);
    setPaymentMessage('');
    try {
      await axios.patch(
        `${API_BASE}/ticket/${foundTicket._id}/payment/mark-paid`,
        { paymentMethod: 'PAYOS' },
        { withCredentials: true },
      );
      setPaymentMessage('Đã xác nhận thanh toán online payOS. Trạng thái đơn chuyển sang PAYMENTED.');
      await searchTicketByCode();
      loadTickets();
    } catch (err: any) {
      setPaymentMessage(err?.response?.data?.message || 'Không thể xác nhận thanh toán online.');
    } finally {
      setPaymentLoading(false);
    }
  };

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-3xl font-black tracking-tight text-slate-900">Receptionist Board</h1>
        <p className="text-sm text-slate-500 mt-1">Tiếp nhận khách hàng, tra mã đơn, thu tiền tại quầy hoặc payOS.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-4">
          <div className="flex items-center justify-between"><p className="text-xs uppercase text-slate-500 tracking-wider">Đơn mới</p><TicketPlus size={16} className="text-indigo-600" /></div>
          <p className="text-2xl font-extrabold mt-2">{tickets.length}</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-4">
          <div className="flex items-center justify-between"><p className="text-xs uppercase text-slate-500 tracking-wider">Khách hàng đã lưu</p><UserRound size={16} className="text-emerald-600" /></div>
          <p className="text-2xl font-extrabold mt-2">{customers.length}</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-4">
          <div className="flex items-center justify-between"><p className="text-xs uppercase text-slate-500 tracking-wider">Đơn đã thu tiền</p><CircleCheckBig size={16} className="text-sky-600" /></div>
          <p className="text-2xl font-extrabold mt-2">{tickets.filter((t) => t.status === 'PAYMENTED').length}</p>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
        <h2 className="font-bold text-lg">Thu tiền khi khách nhận máy</h2>
        <div className="flex flex-col md:flex-row gap-3 relative" ref={ticketSuggestionBoxRef}>
          <div className="flex-1 relative">
            <input
              value={lookupCode}
              onFocus={() => setShowTicketSuggestions(true)}
              onChange={(e) => {
                const next = e.target.value;
                setLookupCode(next);
                searchTicketSuggestions(next);
              }}
              placeholder="Nhập mã đơn hoặc vài ký tự (VD: 201192)"
              className="w-full border border-slate-200 rounded-xl px-3 py-2.5"
            />

            {showTicketSuggestions && ticketSuggestions.length > 0 && (
              <div className="absolute left-0 right-0 z-20 mt-1 bg-white border border-slate-200 rounded-xl shadow-xl overflow-hidden">
                {ticketSuggestions.map((t) => (
                  <button
                    key={t._id}
                    type="button"
                    onClick={() => {
                      setLookupCode(t.ticketCode);
                      setFoundTicket(t);
                      setShowTicketSuggestions(false);
                    }}
                    className="w-full px-3 py-2.5 text-left hover:bg-slate-50 border-b border-slate-100 last:border-b-0"
                  >
                    <p className="font-semibold text-sm text-slate-800">{t.ticketCode}</p>
                    <p className="text-xs font-medium text-slate-700">Khách: {t.device?.customer?.fullName || 'N/A'}</p>
                    <p className="text-xs text-slate-500">{t.device?.deviceType || '-'} • {t.device?.brand || '-'} • {t.device?.model || '-'}</p>
                    <p className="text-xs text-slate-400 truncate">Lỗi: {t.initialIssue || 'Chưa có mô tả lỗi'}</p>
                  </button>
                ))}
              </div>
            )}
          </div>

          <button onClick={() => searchTicketByCode()} disabled={lookupLoading} className="px-4 py-2.5 rounded-xl bg-slate-900 text-white font-semibold disabled:opacity-50">
            {lookupLoading ? 'Đang tìm...' : 'Tìm đơn'}
          </button>
        </div>

        {foundTicket && (
          <div className="rounded-xl border border-slate-200 p-4 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <p className="font-bold text-slate-900">{foundTicket.ticketCode}</p>
                <p className="text-sm font-medium text-slate-700">Khách: {foundTicket.device?.customer?.fullName || 'N/A'}</p>
                <p className="text-xs text-slate-500">{foundTicket.device?.deviceType || '-'} • {foundTicket.device?.brand || '-'} • {foundTicket.device?.model || '-'}</p>
                <p className="text-xs text-slate-500">Lỗi: {foundTicket.initialIssue || 'Chưa có mô tả lỗi'}</p>
              </div>
              <span className={`px-2 py-1 rounded-full text-xs font-semibold ${statusColorClasses[foundTicket.status] || 'bg-slate-100 text-slate-700'}`}>
                {statusLabels[foundTicket.status] || foundTicket.status}
              </span>
            </div>

            <div className="text-sm text-slate-700">
              Tổng tiền cần thu: <strong>{Number(foundTicket.finalCost || 0).toLocaleString('vi-VN')} ₫</strong>
            </div>

            {foundTicket.status === 'COMPLETED' ? (
              <div className="flex flex-wrap gap-2">
                <button onClick={() => { setCashModalOpen(true); setCashGiven(String(Number(foundTicket.finalCost || 0))); }} disabled={paymentLoading} className="px-3 py-2 rounded-lg bg-emerald-600 text-white text-sm font-semibold inline-flex items-center gap-1">
                  <Wallet size={14} /> Thu tiền mặt
                </button>
                <button onClick={createPayos} disabled={paymentLoading} className="px-3 py-2 rounded-lg bg-indigo-600 text-white text-sm font-semibold inline-flex items-center gap-1">
                  <CreditCard size={14} /> Tạo link payOS
                </button>
                <button onClick={markPayosPaid} disabled={paymentLoading} className="px-3 py-2 rounded-lg border border-indigo-200 text-indigo-700 text-sm font-semibold">
                  Xác nhận đã thanh toán online
                </button>
              </div>
            ) : (
              <p className="text-sm text-slate-500"></p>
            )}
          </div>
        )}

        {paymentMessage && <p className="text-sm text-slate-600">{paymentMessage}</p>}
      </div>

      {cashModalOpen && foundTicket && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white rounded-2xl border border-slate-200 shadow-2xl p-5 space-y-4">
            <div>
              <h3 className="text-lg font-bold">Thu tiền mặt</h3>
              <p className="text-sm text-slate-500">Xác nhận thanh toán cho phiếu {foundTicket.ticketCode}</p>
            </div>

            <div className="rounded-xl border border-slate-200 p-3 text-sm space-y-1">
              <p><span className="text-slate-500">Khách hàng:</span> {foundTicket.device?.customer?.fullName || 'N/A'}</p>
              <p><span className="text-slate-500">Thiết bị:</span> {foundTicket.device?.brand} {foundTicket.device?.model}</p>
              <p><span className="text-slate-500">Mô tả lỗi:</span> {foundTicket.initialIssue}</p>
                <span className="text-slate-500">Số tiền khách cần trả:</span>{' '}
                <strong>{Number(foundTicket.finalCost || 0).toLocaleString('vi-VN')} ₫</strong>

            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Số tiền khách đưa</label>
              <input
                type="number"
                min={0}
                value={cashGiven}
                onChange={(e) => setCashGiven(e.target.value)}
                className="w-full border border-slate-200 rounded-xl px-3 py-2.5"
                placeholder="Nhập số tiền khách đưa (vd: 800000)"
              />
            </div>

            <div className="rounded-xl bg-slate-50 border border-slate-200 p-3 text-sm space-y-1">
              <p>
                <span className="text-slate-600">Số tiền khách cần trả:</span>{' '}
                <strong>{Number(foundTicket.finalCost || 0).toLocaleString('vi-VN')} ₫</strong>
              </p>
              <p>
                <span className="text-slate-600">Số tiền khách đưa:</span>{' '}
                <strong>{Number(cashGiven || 0).toLocaleString('vi-VN')} ₫</strong>
              </p>
              <p className="pt-1 border-t border-slate-200">
                <span className="text-slate-600">Số tiền cần trả lại:</span>{' '}
                <strong className="text-lg text-slate-900">
                  {Math.max(Number(cashGiven || 0) - Number(foundTicket.finalCost || 0), 0).toLocaleString('vi-VN')} ₫
                </strong>
              </p>
            </div>

            <div className="flex gap-2 justify-end">
              <button
                onClick={() => {
                  setCashModalOpen(false);
                  setCashGiven('');
                }}
                className="px-3 py-2 rounded-lg border border-slate-300 text-slate-700 text-sm font-semibold"
              >
                Hủy
              </button>
              <button
                onClick={markCashPaid}
                disabled={paymentLoading}
                className="px-3 py-2 rounded-lg bg-emerald-600 text-white text-sm font-semibold disabled:opacity-60"
              >
                {paymentLoading ? 'Đang xác nhận...' : 'Xác nhận đã thu tiền'}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <section className="lg:col-span-1 bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
          <h2 className="font-bold text-lg mb-4">Tiếp nhận khách hàng</h2>
          <form onSubmit={submit} className="space-y-3">
            <input required placeholder="Tên khách hàng" value={form.customerName} onChange={(e) => setForm({ ...form, customerName: e.target.value })} className="w-full border border-slate-200 rounded-xl px-3 py-2.5 bg-white" />

            <div className="relative" ref={suggestionBoxRef}>
              <div className="relative">
                <Phone size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input required placeholder="Số điện thoại" value={form.customerPhone} onFocus={() => setShowSuggestions(true)} onChange={(e) => { setForm({ ...form, customerPhone: e.target.value }); setShowSuggestions(true); }} className="w-full border border-slate-200 rounded-xl pl-9 pr-3 py-2.5 bg-white" />
              </div>
              {showSuggestions && suggestions.length > 0 && (
                <div className="mt-1 w-full bg-white border border-slate-200 rounded-xl shadow-lg max-h-56 overflow-auto">
                  {suggestions.map((c) => (
                    <button type="button" key={c._id} onClick={() => applyCustomer(c)} className="w-full text-left px-3 py-2.5 hover:bg-slate-50 border-b border-slate-100 last:border-b-0">
                      <p className="font-medium text-sm">{c.fullName}</p>
                      <p className="text-xs text-slate-500">{c.phone} {c.email ? `• ${c.email}` : ''}</p>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <input required placeholder="Email" value={form.customerEmail} onFocus={() => setShowSuggestions(true)} onChange={(e) => { setForm({ ...form, customerEmail: e.target.value }); setShowSuggestions(true); }} className="w-full border border-slate-200 rounded-xl px-3 py-2.5 bg-white" />

            <div className="grid grid-cols-2 gap-3">
              <input required placeholder="Loại máy" value={form.deviceType} onChange={(e) => setForm({ ...form, deviceType: e.target.value })} className="w-full border border-slate-200 rounded-xl px-3 py-2.5 bg-white" />
              <input required placeholder="Hãng" value={form.brand} onChange={(e) => setForm({ ...form, brand: e.target.value })} className="w-full border border-slate-200 rounded-xl px-3 py-2.5 bg-white" />
            </div>

            <input placeholder="Model" value={form.model} onChange={(e) => setForm({ ...form, model: e.target.value })} className="w-full border border-slate-200 rounded-xl px-3 py-2.5 bg-white" />
            <textarea required placeholder="Mô tả lỗi ban đầu" value={form.issue} onChange={(e) => setForm({ ...form, issue: e.target.value })} className="w-full border border-slate-200 rounded-xl px-3 py-2.5 bg-white h-24" />

            <button disabled={loading} className="w-full bg-gradient-to-r from-indigo-600 to-violet-600 text-white py-2.5 rounded-xl font-semibold hover:opacity-95 disabled:opacity-60">
              {loading ? 'Đang tạo...' : 'Tạo phiếu'}
            </button>
            {message && <p className="text-sm text-slate-600">{message}</p>}
          </form>
        </section>

        <section className="lg:col-span-2 bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4 gap-3">
            <h2 className="font-bold text-lg">Danh sách đơn</h2>
            <div className="flex flex-wrap items-center gap-2">
              <div className="text-xs text-slate-500 inline-flex items-center gap-1"><Clock3 size={13} /> Tổng {filteredTickets.length} đơn</div>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs bg-white"
              >
                {statusOptions.map((status) => (
                  <option key={status} value={status}>
                    {status === 'ALL' ? 'Tất cả trạng thái' : (statusLabels[status] || status)}
                  </option>
                ))}
              </select>
              <select
                value={ticketPageSize}
                onChange={(e) => setTicketPageSize(Number(e.target.value))}
                className="border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs bg-white"
              >
                <option value={5}>5 / trang</option>
                <option value={10}>10 / trang</option>
                <option value={20}>20 / trang</option>
              </select>
            </div>
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
                {pagedTickets.map((t, idx) => (
                  <motion.tr key={t._id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.03 }} className="border-t border-slate-100 hover:bg-slate-50/60">
                    <td className="px-3 py-2.5 font-semibold text-slate-800">{t.ticketCode}</td>
                    <td className="px-3 py-2.5">{t.device?.customer?.fullName || 'N/A'}</td>
                    <td className="px-3 py-2.5">{t.device?.deviceType || 'N/A'}</td>
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

          <div className="mt-3 flex flex-col md:flex-row md:items-center md:justify-between gap-2">
            <div className="text-xs text-slate-500 inline-flex items-center gap-1"><Search size={12} /> Gợi ý khách hàng tự động khi nhập số điện thoại/email.</div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setTicketPage((p) => Math.max(1, p - 1))}
                disabled={ticketPage <= 1}
                className="px-2.5 py-1.5 text-xs rounded-md border border-slate-300 disabled:opacity-40"
              >
                Trước
              </button>
              <span className="text-xs text-slate-500">Trang {ticketPage}/{ticketTotalPages}</span>
              <button
                onClick={() => setTicketPage((p) => Math.min(ticketTotalPages, p + 1))}
                disabled={ticketPage >= ticketTotalPages}
                className="px-2.5 py-1.5 text-xs rounded-md border border-slate-300 disabled:opacity-40"
              >
                Sau
              </button>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};