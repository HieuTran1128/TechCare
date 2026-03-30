import React, { useEffect, useMemo, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CircleCheckBig, Clock3, CreditCard, Phone, Search, TicketPlus, UserRound, Wallet } from 'lucide-react';
import { useTickets, useCustomers } from '../hooks';
import { customerService, deviceService, ticketService } from '../services';
import { TICKET_STATUS_LABELS } from '../constants';
import { StatusBadge, Pagination } from '../components/ui';
import type { Customer, Ticket } from '../types';

export const ReceptionistBoard: React.FC = () => {
  const location = useLocation();
  const { tickets, reload: reloadTickets } = useTickets({ limit: 100, sort: '-updatedAt' });
  const { customers, reload: reloadCustomers } = useCustomers();

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
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
  const [form, setForm] = useState({ customerName: '', customerPhone: '', customerEmail: '', deviceType: '', brand: '', model: '', issue: '' });

  useEffect(() => {
    const onClickOutside = () => { setShowSuggestions(false); setShowTicketSuggestions(false); };
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const paymentStatus = params.get('payment');
    const ticketCode = params.get('ticket');
    if (!paymentStatus) return;
    if (paymentStatus === 'success') {
      setPaymentMessage(`Khách đã thanh toán online thành công${ticketCode ? ` cho phiếu ${ticketCode}` : ''}.`);
      if (ticketCode) { setLookupCode(ticketCode); searchTicketByCode(ticketCode); }
    }
    if (paymentStatus === 'cancel') {
      setPaymentMessage(`Khách đã hủy thanh toán online${ticketCode ? ` cho phiếu ${ticketCode}` : ''}.`);
      if (ticketCode) setLookupCode(ticketCode);
    }
  }, [location.search]);

  const suggestions = useMemo(() => {
    const phone = form.customerPhone.trim();
    const email = form.customerEmail.trim().toLowerCase();
    if (!phone && !email) return [];
    return customers.filter((c) => (phone ? c.phone?.includes(phone) : false) || (email ? c.email?.toLowerCase().includes(email) : false)).slice(0, 6);
  }, [customers, form.customerPhone, form.customerEmail]);

  const applyCustomer = (c: Customer) => {
    setForm((prev) => ({ ...prev, customerName: c.fullName || '', customerPhone: c.phone || '', customerEmail: c.email || '' }));
    setShowSuggestions(false);
  };

  const statusOptions = useMemo(() => ['ALL', ...Array.from(new Set(tickets.map((t) => t.status).filter(Boolean)))], [tickets]);
  const filteredTickets = useMemo(() => statusFilter === 'ALL' ? tickets : tickets.filter((t) => t.status === statusFilter), [tickets, statusFilter]);
  const ticketTotalPages = Math.max(1, Math.ceil(filteredTickets.length / ticketPageSize));
  const pagedTickets = useMemo(() => filteredTickets.slice((ticketPage - 1) * ticketPageSize, ticketPage * ticketPageSize), [filteredTickets, ticketPage, ticketPageSize]);

  useEffect(() => { setTicketPage(1); }, [statusFilter, ticketPageSize]);
  useEffect(() => { if (ticketPage > ticketTotalPages) setTicketPage(ticketTotalPages); }, [ticketPage, ticketTotalPages]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true); setMessage('');
    try {
      const byPhone = customers.find((c) => c.phone === form.customerPhone.trim());
      const byEmail = customers.find((c) => c.email?.toLowerCase() === form.customerEmail.trim().toLowerCase());
      const found = byPhone || byEmail;
      let customerId = found?._id;
      if (!customerId) {
        const nc = await customerService.create({ fullName: form.customerName.trim(), phone: form.customerPhone.trim(), email: form.customerEmail.trim() });
        customerId = nc._id;
      } else {
        await customerService.update(customerId, { fullName: form.customerName.trim(), phone: form.customerPhone.trim(), email: form.customerEmail.trim() });
      }
      const device = await deviceService.create({ customerId, deviceType: form.deviceType.trim(), brand: form.brand.trim(), model: form.model.trim() });
      await ticketService.create({ deviceId: device._id!, initialIssue: form.issue.trim() });
      setMessage('Tạo phiếu thành công. Quản lý sẽ phân công kỹ thuật viên.');
      setForm({ customerName: '', customerPhone: '', customerEmail: '', deviceType: '', brand: '', model: '', issue: '' });
      setShowSuggestions(false);
      reloadTickets(); reloadCustomers();
    } catch (err: any) {
      const msg = err.response?.data?.message;
      if (msg === 'EMAIL_ALREADY_EXISTS') setMessage('Email đã tồn tại ở khách hàng khác.');
      else if (msg === 'CUSTOMER_ALREADY_EXISTS') setMessage('Số điện thoại đã tồn tại. Hệ thống sẽ dùng hồ sơ khách hàng cũ.');
      else setMessage(msg || 'Tạo phiếu thất bại');
    } finally { setLoading(false); }
  };

  const searchTicketByCode = async (keyword?: string) => {
    const q = (keyword ?? lookupCode).trim();
    if (!q) return;
    setLookupLoading(true); setPaymentMessage(''); setFoundTicket(null);
    try { const ticket = await ticketService.findByCode(q); setFoundTicket(ticket); setShowTicketSuggestions(false); }
    catch (err: any) { setPaymentMessage(err?.response?.data?.message || 'Không tìm thấy đơn theo mã đã nhập.'); }
    finally { setLookupLoading(false); }
  };

  const searchTicketSuggestions = async (keyword: string) => {
    const q = keyword.trim();
    if (!q || q.length < 2) { setTicketSuggestions([]); return; }
    try { const res = await ticketService.searchByCode(q, 8); setTicketSuggestions(res.data || []); setShowTicketSuggestions(true); }
    catch { setTicketSuggestions([]); }
  };

  const markCashPaid = async () => {
    if (!foundTicket) return;
    const cash = Number(cashGiven || 0);
    if (!cash || Number.isNaN(cash)) { setPaymentMessage('Vui lòng nhập số tiền khách đưa hợp lệ.'); return; }
    if (cash < Number(foundTicket.finalCost || 0)) { setPaymentMessage('Số tiền khách đưa chưa đủ.'); return; }
    setPaymentLoading(true);
    try {
      await ticketService.markCashPaid(foundTicket._id);
      setPaymentMessage('Đã xác nhận thanh toán tiền mặt.');
      setCashModalOpen(false); setCashGiven('');
      await searchTicketByCode(foundTicket.ticketCode); reloadTickets();
    } catch (err: any) { setPaymentMessage(err?.response?.data?.message || 'Không thể xác nhận thanh toán tiền mặt.'); }
    finally { setPaymentLoading(false); }
  };

  const createPayos = async () => {
    if (!foundTicket) return;
    setPaymentLoading(true);
    try { const res = await ticketService.createPayOSPayment(foundTicket._id); window.open(res.checkoutUrl, '_blank'); setPaymentMessage('Đã tạo link thanh toán payOS.'); }
    catch (err: any) { setPaymentMessage(err?.response?.data?.message || 'Không thể tạo thanh toán payOS.'); }
    finally { setPaymentLoading(false); }
  };

  const markPayosPaid = async () => {
    if (!foundTicket) return;
    setPaymentLoading(true);
    try { await ticketService.markPayOSPaid(foundTicket._id); setPaymentMessage('Đã xác nhận thanh toán online payOS.'); await searchTicketByCode(); reloadTickets(); }
    catch (err: any) { setPaymentMessage(err?.response?.data?.message || 'Không thể xác nhận thanh toán online.'); }
    finally { setPaymentLoading(false); }
  };

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-3xl font-black tracking-tight text-slate-900">Receptionist Board</h1>
        <p className="text-sm text-slate-500 mt-1">Tiếp nhận khách hàng, tra mã đơn, thu tiền tại quầy hoặc payOS.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {[
          { label: 'Tổng đơn', value: tickets.length, icon: <TicketPlus size={16} className="text-indigo-600" /> },
          { label: 'Khách hàng đã lưu', value: customers.length, icon: <UserRound size={16} className="text-emerald-600" /> },
          { label: 'Đơn đã thu tiền', value: tickets.filter((t) => t.status === 'PAYMENTED').length, icon: <CircleCheckBig size={16} className="text-sky-600" /> },
        ].map((s) => (
          <div key={s.label} className="rounded-2xl border bg-white p-4">
            <div className="flex items-center justify-between"><p className="text-xs uppercase text-slate-500 tracking-wider">{s.label}</p>{s.icon}</div>
            <p className="text-2xl font-extrabold mt-2">{s.value}</p>
          </div>
        ))}
      </div>

      <div className="bg-white border rounded-2xl p-5 shadow-sm space-y-4">
        <h2 className="font-bold text-lg">Thu tiền khi khách nhận máy</h2>
        <div className="flex flex-col md:flex-row gap-3 relative">
          <div className="flex-1 relative">
            <input value={lookupCode} onFocus={() => setShowTicketSuggestions(true)} onChange={(e) => { setLookupCode(e.target.value); searchTicketSuggestions(e.target.value); }} placeholder="Nhập mã đơn hoặc vài ký tự (VD: 201192)" className="w-full border rounded-xl px-3 py-2.5" />
            {showTicketSuggestions && ticketSuggestions.length > 0 && (
              <div className="absolute left-0 right-0 z-20 mt-1 bg-white border rounded-xl shadow-xl overflow-hidden">
                {ticketSuggestions.map((t) => (
                  <button key={t._id} type="button" onClick={() => { setLookupCode(t.ticketCode); setFoundTicket(t); setShowTicketSuggestions(false); }} className="w-full px-3 py-2.5 text-left hover:bg-slate-50 border-b border-slate-100 last:border-b-0">
                    <p className="font-semibold text-sm">{t.ticketCode}</p>
                    <p className="text-xs text-slate-500">{t.device?.customer?.fullName || 'N/A'} • {t.device?.brand || '-'} {t.device?.model || '-'}</p>
                  </button>
                ))}
              </div>
            )}
          </div>
          <button onClick={() => searchTicketByCode()} disabled={lookupLoading} className="px-4 py-2.5 rounded-xl bg-slate-900 text-white font-semibold disabled:opacity-50">{lookupLoading ? 'Đang tìm...' : 'Tìm đơn'}</button>
        </div>
        {foundTicket && (
          <div className="rounded-xl border p-4 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <p className="font-bold">{foundTicket.ticketCode}</p>
                <p className="text-sm text-slate-700">Khách: {foundTicket.device?.customer?.fullName || 'N/A'}</p>
                <p className="text-xs text-slate-500">{foundTicket.device?.deviceType || '-'} • {foundTicket.device?.brand || '-'} • {foundTicket.device?.model || '-'}</p>
              </div>
              <StatusBadge status={foundTicket.status} />
            </div>
            <p className="text-sm">Tổng tiền cần thu: <strong>{Number(foundTicket.finalCost || 0).toLocaleString('vi-VN')} ₫</strong></p>
            {foundTicket.status === 'COMPLETED' && (
              <div className="flex flex-wrap gap-2">
                <button onClick={() => { setCashModalOpen(true); setCashGiven(String(Number(foundTicket.finalCost || 0))); }} disabled={paymentLoading} className="px-3 py-2 rounded-lg bg-emerald-600 text-white text-sm font-semibold inline-flex items-center gap-1"><Wallet size={14} /> Thu tiền mặt</button>
                <button onClick={createPayos} disabled={paymentLoading} className="px-3 py-2 rounded-lg bg-indigo-600 text-white text-sm font-semibold inline-flex items-center gap-1"><CreditCard size={14} /> Tạo link payOS</button>
                <button onClick={markPayosPaid} disabled={paymentLoading} className="px-3 py-2 rounded-lg border border-indigo-200 text-indigo-700 text-sm font-semibold">Xác nhận đã thanh toán online</button>
              </div>
            )}
          </div>
        )}
        {paymentMessage && <p className="text-sm text-slate-600">{paymentMessage}</p>}
      </div>

      {cashModalOpen && foundTicket && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl p-5 space-y-4">
            <div><h3 className="text-lg font-bold">Thu tiền mặt</h3><p className="text-sm text-slate-500">Phiếu {foundTicket.ticketCode}</p></div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Số tiền khách đưa</label>
              <input type="number" min={0} value={cashGiven} onChange={(e) => setCashGiven(e.target.value)} className="w-full border rounded-xl px-3 py-2.5" placeholder="Nhập số tiền khách đưa" />
            </div>
            <div className="rounded-xl bg-slate-50 border p-3 text-sm space-y-1">
              <p><span className="text-slate-600">Cần trả:</span> <strong>{Number(foundTicket.finalCost || 0).toLocaleString('vi-VN')} ₫</strong></p>
              <p><span className="text-slate-600">Khách đưa:</span> <strong>{Number(cashGiven || 0).toLocaleString('vi-VN')} ₫</strong></p>
              <p className="pt-1 border-t"><span className="text-slate-600">Tiền thừa:</span> <strong className="text-lg">{Math.max(Number(cashGiven || 0) - Number(foundTicket.finalCost || 0), 0).toLocaleString('vi-VN')} ₫</strong></p>
            </div>
            <div className="flex gap-2 justify-end">
              <button onClick={() => { setCashModalOpen(false); setCashGiven(''); }} className="px-3 py-2 rounded-lg border text-sm font-semibold">Hủy</button>
              <button onClick={markCashPaid} disabled={paymentLoading} className="px-3 py-2 rounded-lg bg-emerald-600 text-white text-sm font-semibold disabled:opacity-60">{paymentLoading ? 'Đang xác nhận...' : 'Xác nhận đã thu tiền'}</button>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <section className="lg:col-span-1 bg-white border rounded-2xl p-5 shadow-sm">
          <h2 className="font-bold text-lg mb-4">Tiếp nhận khách hàng</h2>
          <form onSubmit={submit} className="space-y-3">
            <input required placeholder="Tên khách hàng" value={form.customerName} onChange={(e) => setForm({ ...form, customerName: e.target.value })} className="w-full border rounded-xl px-3 py-2.5 bg-white" />
            <div className="relative">
              <div className="relative">
                <Phone size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input required placeholder="Số điện thoại" value={form.customerPhone} onFocus={() => setShowSuggestions(true)} onChange={(e) => { setForm({ ...form, customerPhone: e.target.value }); setShowSuggestions(true); }} className="w-full border rounded-xl pl-9 pr-3 py-2.5 bg-white" />
              </div>
              {showSuggestions && suggestions.length > 0 && (
                <div className="mt-1 w-full bg-white border rounded-xl shadow-lg max-h-56 overflow-auto absolute z-10">
                  {suggestions.map((c) => (
                    <button type="button" key={c._id} onClick={() => applyCustomer(c)} className="w-full text-left px-3 py-2.5 hover:bg-slate-50 border-b border-slate-100 last:border-b-0">
                      <p className="font-medium text-sm">{c.fullName}</p>
                      <p className="text-xs text-slate-500">{c.phone} {c.email ? `• ${c.email}` : ''}</p>
                    </button>
                  ))}
                </div>
              )}
            </div>
            <input required placeholder="Email" value={form.customerEmail} onFocus={() => setShowSuggestions(true)} onChange={(e) => { setForm({ ...form, customerEmail: e.target.value }); setShowSuggestions(true); }} className="w-full border rounded-xl px-3 py-2.5 bg-white" />
            <div className="grid grid-cols-2 gap-3">
              <input required placeholder="Loại máy" value={form.deviceType} onChange={(e) => setForm({ ...form, deviceType: e.target.value })} className="w-full border rounded-xl px-3 py-2.5 bg-white" />
              <input required placeholder="Hãng" value={form.brand} onChange={(e) => setForm({ ...form, brand: e.target.value })} className="w-full border rounded-xl px-3 py-2.5 bg-white" />
            </div>
            <input placeholder="Model" value={form.model} onChange={(e) => setForm({ ...form, model: e.target.value })} className="w-full border rounded-xl px-3 py-2.5 bg-white" />
            <textarea required placeholder="Mô tả lỗi ban đầu" value={form.issue} onChange={(e) => setForm({ ...form, issue: e.target.value })} className="w-full border rounded-xl px-3 py-2.5 bg-white h-24 resize-none" />
            <button disabled={loading} className="w-full bg-gradient-to-r from-indigo-600 to-violet-600 text-white py-2.5 rounded-xl font-semibold disabled:opacity-60">{loading ? 'Đang tạo...' : 'Tạo phiếu'}</button>
            {message && <p className="text-sm text-slate-600">{message}</p>}
          </form>
        </section>

        <section className="lg:col-span-2 bg-white border rounded-2xl p-5 shadow-sm">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4 gap-3">
            <h2 className="font-bold text-lg">Danh sách đơn</h2>
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs text-slate-500 inline-flex items-center gap-1"><Clock3 size={13} /> Tổng {filteredTickets.length} đơn</span>
              <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="border rounded-lg px-2.5 py-1.5 text-xs bg-white">
                {statusOptions.map((status) => (
                  <option key={status} value={status}>{status === 'ALL' ? 'Tất cả trạng thái' : (TICKET_STATUS_LABELS[status as keyof typeof TICKET_STATUS_LABELS] || status)}</option>
                ))}
              </select>
              <select value={ticketPageSize} onChange={(e) => setTicketPageSize(Number(e.target.value))} className="border rounded-lg px-2.5 py-1.5 text-xs bg-white">
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
                    <td className="px-3 py-2.5"><StatusBadge status={t.status} /></td>
                    <td className="px-3 py-2.5 text-slate-500">{new Date(t.createdAt).toLocaleString('vi-VN')}</td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-3 flex items-center justify-between">
            <span className="text-xs text-slate-500 inline-flex items-center gap-1"><Search size={12} /> Gợi ý khách hàng tự động khi nhập SĐT/email.</span>
            <Pagination currentPage={ticketPage} totalPages={ticketTotalPages} onPageChange={setTicketPage} />
          </div>
        </section>
      </div>
    </div>
  );
};
