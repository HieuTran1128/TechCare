import React, { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api';

interface Ticket {
  _id: string;
  ticketCode: string;
  status: string;
  initialIssue: string;
  isWarrantyClaim?: boolean;
  warrantyClaimType?: 'STORE_FAULT' | 'CUSTOMER_FAULT';
  quote?: {
    diagnosisResult?: string;
    laborCost?: number;
    estimatedCost?: number;
    workDescription?: string;
    estimatedCompletionDate?: string;
  };
  inventoryRequest?: {
    status?: string;
    requiredParts?: Array<{
      part?: { _id?: string; partName?: string; brand?: string; price?: number };
      quantity?: number;
    }>;
  };
  technician?: { _id: string; fullName: string };
  device?: {
    deviceType?: string;
    brand: string;
    model: string;
    customer?: { fullName: string; email: string };
  };
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
  RECEIVED: 'Mới tiếp nhận',
  DONE_INVENTORY_REJECTED: 'Kho từ chối',
  WARRANTY_DONE: 'Bảo hành xong',
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
};

interface PartOption {
  _id: string;
  partName: string;
  brand?: string;
  stock?: number;
}

const statusTimeline = ['RECEIVED', 'DIAGNOSING', 'WAITING_INVENTORY', 'INVENTORY_APPROVED', 'QUOTED', 'IN_PROGRESS', 'COMPLETED'];

export const TechnicianBoard: React.FC = () => {
  const { user } = useAuth();
  const isFrontdesk = user?.role === 'frontdesk';
  const isTechnician = user?.role === 'technician';

  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [technicians, setTechnicians] = useState<any[]>([]);
  const [parts, setParts] = useState<PartOption[]>([]);
  const [selectedTech, setSelectedTech] = useState('');
  const [active, setActive] = useState<Ticket | null>(null);
  const [activeTab, setActiveTab] = useState<'request' | 'quote' | 'reject' | 'warranty'>('request');
  const [note, setNote] = useState('');
  const [rejectionMessage, setRejectionMessage] = useState('Hiện tại cửa hàng không có linh kiện thay thế. Mong quý khách thông cảm.');
  const [quoteError, setQuoteError] = useState('');
  const [doneSearch, setDoneSearch] = useState('');
  const [donePage, setDonePage] = useState(1);
  const donePageSize = 6;

  const [quote, setQuote] = useState({
    diagnosisResult: '',
    laborCost: '',
    estimatedCost: '',
    workDescription: '',
    estimatedCompletionDate: '',
  });

  // warrantyMonths per part: { [partId]: 0 | 1 | 3 | 6 }
  const [partsWarranty, setPartsWarranty] = useState<Record<string, number>>({});

  const approvedPartsCost = useMemo(() => {
    const requiredParts = active?.inventoryRequest?.requiredParts || [];
    return requiredParts.reduce((total, item) => total + (item.part?.price || 0) * (item.quantity || 0), 0);
  }, [active]);

  const todayString = useMemo(() => {
    const today = new Date();
    const offset = today.getTimezoneOffset();
    const localDate = new Date(today.getTime() - offset * 60 * 1000);
    return localDate.toISOString().slice(0, 10);
  }, []);

  const [inventoryReq, setInventoryReq] = useState({
    needsReplacement: false,
    noteFromTechnician: '',
    requiredParts: [{ part: '', quantity: 1, unitPrice: 0 }],
  });

  const loadTickets = async () => {
    const params: any = { limit: 100, sort: '-createdAt' };
    if (isFrontdesk && selectedTech) params.technicianId = selectedTech;

    const res = await axios.get(`${API_BASE}/ticket`, { params, withCredentials: true });
    setTickets(res.data.data || []);
  };

  const loadTechnicians = async () => {
    if (!isFrontdesk) return;
    const res = await axios.get(`${API_BASE}/users?role=technician`, { withCredentials: true });
    setTechnicians(res.data.data || []);
  };

  const loadParts = async () => {
    const res = await axios.get(`${API_BASE}/parts`, { withCredentials: true });
    setParts(res.data || []);
  };

  useEffect(() => {
    loadTickets().catch(() => undefined);
    loadTechnicians().catch(() => undefined);
    loadParts().catch(() => undefined);
  }, [selectedTech]);

  const pendingAssign = useMemo(() => tickets.filter((t) => t.status === 'RECEIVED'), [tickets]);
  const inFlow = useMemo(
    () =>
      tickets.filter((t) => ['DIAGNOSING', 'WAITING_INVENTORY', 'INVENTORY_APPROVED', 'INVENTORY_REJECTED', 'QUOTED', 'CUSTOMER_APPROVED', 'IN_PROGRESS'].includes(t.status)),
    [tickets],
  );
  const doneRaw = useMemo(() => tickets.filter((t) => ['COMPLETED', 'PAYMENTED', 'CUSTOMER_REJECTED', 'DONE_INVENTORY_REJECTED', 'WARRANTY_DONE'].includes(t.status)), [tickets]);

  const done = useMemo(() => {
    const q = doneSearch.trim().toLowerCase();
    if (!q) return doneRaw;
    return doneRaw.filter((t) => {
      const code = String(t.ticketCode || '').toLowerCase();
      const customer = String(t.device?.customer?.fullName || '').toLowerCase();
      const deviceType = String(t.device?.deviceType || '').toLowerCase();
      const brand = String(t.device?.brand || '').toLowerCase();
      const model = String(t.device?.model || '').toLowerCase();
      const device = `${deviceType} ${brand} ${model}`.toLowerCase();
      return code.includes(q) || customer.includes(q) || device.includes(q);
    });
  }, [doneRaw, doneSearch]);

  const doneTotalPages = Math.max(1, Math.ceil(done.length / donePageSize));

  const donePaged = useMemo(() => {
    const start = (donePage - 1) * donePageSize;
    return done.slice(start, start + donePageSize);
  }, [done, donePage]);

  const assignTech = async (ticketId: string, technicianId: string) => {
    await axios.patch(`${API_BASE}/ticket/${ticketId}/assign`, { technicianId }, { withCredentials: true });
    loadTickets();
  };

  const submitInventoryRequest = async () => {
    if (!active) return;
    const payload = inventoryReq.needsReplacement ? inventoryReq : { ...inventoryReq, noteFromTechnician: '', requiredParts: [] };

    await axios.patch(`${API_BASE}/ticket/${active._id}/inventory-request`, payload, { withCredentials: true });

    if (!inventoryReq.needsReplacement) {
      setActiveTab('quote');
      setActive({ ...active, status: 'INVENTORY_APPROVED', inventoryRequest: { ...(active.inventoryRequest || {}), status: 'NOT_REQUIRED', requiredParts: [] } });
      loadTickets();
      return;
    }

    setActive(null);
    setActiveTab('request');
    loadTickets();
  };

  const submitQuote = async () => {
    if (!active || active.status !== 'INVENTORY_APPROVED') return;

    const selectedDate = quote.estimatedCompletionDate ? new Date(quote.estimatedCompletionDate) : null;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (selectedDate && selectedDate.getTime() < today.getTime()) {
      setQuoteError('Ngày dự kiến hoàn thành không được ở quá khứ.');
      return;
    }

    setQuoteError('');

    await axios.patch(
      `${API_BASE}/ticket/${active._id}/quotation`,
      { ...quote, laborCost: Number(quote.laborCost || 0), estimatedCost: Number(quote.estimatedCost || 0), partsWarranty: Object.entries(partsWarranty).map(([partId, warrantyMonths]) => ({ partId, warrantyMonths })) },
      { withCredentials: true },
    );
    setActive(null);
    setActiveTab('request');
    setPartsWarranty({});
    loadTickets();
  };

  const sendInventoryRejection = async () => {
    if (!active || active.status !== 'INVENTORY_REJECTED') return;
    await axios.patch(`${API_BASE}/ticket/${active._id}/inventory-reject-mail`, { message: rejectionMessage }, { withCredentials: true });
    setActive(null);
    setActiveTab('request');
    loadTickets();
  };

  const startRepair = async (id: string) => {
    await axios.patch(`${API_BASE}/ticket/${id}/start`, {}, { withCredentials: true });
    loadTickets();
  };

  const complete = async (id: string) => {
    await axios.patch(`${API_BASE}/ticket/${id}/complete`, { pickupNote: note, usedParts: [], finalCost: 0 }, { withCredentials: true });
    setNote('');
    loadTickets();
  };

  const completeWarranty = async (id: string) => {
    await axios.patch(`${API_BASE}/warranties/ticket/${id}/complete`, { pickupNote: '' }, { withCredentials: true });
    loadTickets();
  };

  const startWarrantyRepair = async (id: string) => {
    await axios.patch(`${API_BASE}/warranties/ticket/${id}/start`, {}, { withCredentials: true });
    loadTickets();
  };

  useEffect(() => {
    setDonePage(1);
  }, [doneSearch]);

  useEffect(() => {
    if (donePage > doneTotalPages) setDonePage(doneTotalPages);
  }, [donePage, doneTotalPages]);

  const renderTimeline = (status: string) => {
    const currentIdx = statusTimeline.indexOf(status);
    return (
      <div className="flex gap-1 mt-2">
        {statusTimeline.map((s, idx) => (
          <div key={s} className={`h-1.5 flex-1 rounded-full ${currentIdx >= idx ? 'bg-indigo-500' : 'bg-slate-200'}`} />
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
        </div>
        {isFrontdesk && (
          <select value={selectedTech} onChange={(e) => setSelectedTech(e.target.value)} className="border rounded-xl px-3 py-2 bg-white">
            <option value="">Tất cả kỹ thuật viên</option>
            {technicians.map((t) => (
              <option key={t._id} value={t._id}>{t.fullName}</option>
            ))}
          </select>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <section className="bg-white border rounded-2xl p-4">
          <h2 className="font-semibold mb-3">Chờ phân công</h2>
          {pendingAssign.map((t) => (
            <div key={t._id} className="border rounded-xl p-3 mb-3">
              <p className="font-semibold">{t.ticketCode}</p>
              <p className="text-sm">{t.device?.deviceType || '-'} • {t.device?.brand || '-'} • {t.device?.model || '-'}</p>
              <p className="text-xs text-slate-500">{t.initialIssue}</p>
              {isFrontdesk && (
                <select defaultValue="" onChange={(e) => e.target.value && assignTech(t._id, e.target.value)} className="w-full mt-2 border rounded-lg px-2 py-1">
                  <option value="">Phân công kỹ thuật viên</option>
                  {technicians.map((tech) => (
                    <option key={tech._id} value={tech._id}>{tech.fullName}</option>
                  ))}
                </select>
              )}
            </div>
          ))}
        </section>

        <section className="bg-white border rounded-2xl p-4">
          <h2 className="font-semibold mb-3">Đang xử lý</h2>
          {inFlow.map((t) => (
            <motion.div key={t._id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="border rounded-xl p-3 mb-3">
              <p className="font-semibold">{t.ticketCode}</p>
              <div className="mb-1">
                <span className={`inline-flex px-2 py-1 rounded-full text-xs font-semibold ${statusColorClasses[t.status] || 'bg-slate-100 text-slate-700'}`}>
                  {statusLabels[t.status] || t.status}
                </span>
                {t.isWarrantyClaim && (
                  <span className="ml-1 inline-flex px-2 py-1 rounded-full text-xs font-bold bg-violet-100 text-violet-700">BẢO HÀNH</span>
                )}
              </div>
              {renderTimeline(t.status)}
              <p className="text-sm mt-2">{t.device?.customer?.fullName}</p>
              <p className="text-xs text-slate-500">{t.device?.deviceType || '-'} • {t.device?.brand || '-'} • {t.device?.model || '-'}</p>
              <p className="text-xs text-slate-500">{t.initialIssue}</p>

              {isTechnician && t.status === 'DIAGNOSING' && (
                <button onClick={() => { setActive(t); setActiveTab('request'); setQuote({ diagnosisResult: '', laborCost: '', estimatedCost: '', workDescription: '', estimatedCompletionDate: '' }); setQuoteError(''); }} className="mt-2 text-sm bg-blue-600 text-white px-3 py-1 rounded-lg">Chẩn đoán & gửi yêu cầu kho</button>
              )}

              {isTechnician && t.status === 'INVENTORY_APPROVED' && (
                <button
                  onClick={() => {
                    setActive(t);
                    if (t.isWarrantyClaim && t.warrantyClaimType === 'STORE_FAULT') {
                      setActiveTab('warranty');
                    } else {
                      const existingQuote = t.quote || {};
                      const laborValue = existingQuote.laborCost ?? existingQuote.estimatedCost;
                      const laborCost = laborValue ? String(laborValue) : '';
                      const totalCost = Number(laborValue || 0) + approvedPartsCost;
                      setQuote({ diagnosisResult: existingQuote.diagnosisResult || '', laborCost, estimatedCost: totalCost ? String(totalCost) : '', workDescription: existingQuote.workDescription || '', estimatedCompletionDate: existingQuote.estimatedCompletionDate ? String(existingQuote.estimatedCompletionDate).slice(0, 10) : '' });
                      setQuoteError('');
                      setActiveTab('quote');
                    }
                  }}
                  className={`mt-2 text-sm text-white px-3 py-1 rounded-lg ${t.isWarrantyClaim && t.warrantyClaimType === 'STORE_FAULT' ? 'bg-violet-600' : 'bg-purple-600'}`}
                >
                  {t.isWarrantyClaim && t.warrantyClaimType === 'STORE_FAULT' ? 'Xử lý bảo hành' : 'Nhập báo giá'}
                </button>
              )}

              {isTechnician && t.status === 'INVENTORY_REJECTED' && (
                <button onClick={() => { setActive(t); setActiveTab('reject'); setRejectionMessage('Hiện tại cửa hàng không có linh kiện thay thế. Mong quý khách thông cảm.'); }} className="mt-2 text-sm bg-rose-600 text-white px-3 py-1 rounded-lg">Gửi thông báo cho khách</button>
              )}

              {isTechnician && t.status === 'CUSTOMER_APPROVED' && (
                <button onClick={() => startRepair(t._id)} className="mt-2 text-sm bg-emerald-600 text-white px-3 py-1 rounded-lg">Bắt đầu sửa</button>
              )}

              {isTechnician && t.status === 'IN_PROGRESS' && (
                t.isWarrantyClaim
                  ? <button onClick={() => completeWarranty(t._id)} className="mt-2 text-sm bg-violet-600 text-white px-3 py-1 rounded-lg">Hoàn thành bảo hành & gửi mail</button>
                  : <button onClick={() => complete(t._id)} className="mt-2 text-sm bg-indigo-600 text-white px-3 py-1 rounded-lg">Hoàn thành & gửi mail lấy máy</button>
              )}
            </motion.div>
          ))}
        </section>

        <section className="bg-white border rounded-2xl p-4">
          <div className="flex items-center justify-between mb-3 gap-2">
            <h2 className="font-semibold">Hoàn tất / Từ chối</h2>
            <input
              value={doneSearch}
              onChange={(e) => setDoneSearch(e.target.value)}
              placeholder="Tìm mã phiếu / khách / thiết bị"
              className="border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs bg-white w-52"
            />
          </div>

          {donePaged.map((t) => (
            <div key={t._id} className="border rounded-xl p-3 mb-3">
              <div className="flex items-start justify-between gap-2 mb-1">
                <p className="font-bold text-base text-slate-900">{t.ticketCode}</p>
                <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-bold ${statusColorClasses[t.status] || 'bg-slate-50 text-slate-500'}`}>
                  {statusLabels[t.status] || t.status}
                </span>
              </div>
              <p className="text-sm">{t.device?.customer?.fullName}</p>
              <p className="text-xs text-slate-500">{t.device?.deviceType || '-'} • {t.device?.brand || '-'} • {t.device?.model || '-'}</p>
              <p className="text-xs text-slate-500">{t.initialIssue}</p>
            </div>
          ))}

          <div className="flex items-center justify-between text-xs text-slate-500 mt-2">
            <span>Trang {donePage}/{doneTotalPages}</span>
            <div className="flex gap-1">
              <button onClick={() => setDonePage((p) => Math.max(1, p - 1))} disabled={donePage <= 1} className="px-2 py-1 border rounded disabled:opacity-40">Trước</button>
              <button onClick={() => setDonePage((p) => Math.min(doneTotalPages, p + 1))} disabled={donePage >= doneTotalPages} className="px-2 py-1 border rounded disabled:opacity-40">Sau</button>
            </div>
          </div>
        </section>
      </div>

      {active && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
          <div className="bg-white w-full max-w-xl rounded-2xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-lg">Xử lý phiếu {active.ticketCode}</h3>
                <p className="text-xs text-slate-500">{active.device?.deviceType || '-'} • {active.device?.brand || '-'} • {active.device?.model || '-'}</p>
                <p className="text-xs text-slate-600 mt-1">{active.initialIssue || 'Chưa có mô tả lỗi'}</p>
              </div>
              <div className="flex gap-2">
                <button onClick={() => setActiveTab('request')} className={`px-3 py-1 rounded-lg text-sm ${activeTab === 'request' ? 'bg-blue-600 text-white' : 'border'}`}>Yêu cầu kho</button>
                {!(active.isWarrantyClaim && active.warrantyClaimType === 'STORE_FAULT') && (
                  <button onClick={() => setActiveTab('quote')} disabled={active.status !== 'INVENTORY_APPROVED'} className={`px-3 py-1 rounded-lg text-sm ${activeTab === 'quote' ? 'bg-purple-600 text-white' : 'border'} disabled:opacity-50`}>Báo giá</button>
                )}
                {active.isWarrantyClaim && active.warrantyClaimType === 'STORE_FAULT' && (
                  <button onClick={() => setActiveTab('warranty')} disabled={active.status !== 'INVENTORY_APPROVED'} className={`px-3 py-1 rounded-lg text-sm ${activeTab === 'warranty' ? 'bg-violet-600 text-white' : 'border'} disabled:opacity-50`}>Bảo hành</button>
                )}
                <button onClick={() => setActiveTab('reject')} disabled={active.status !== 'INVENTORY_REJECTED'} className={`px-3 py-1 rounded-lg text-sm ${activeTab === 'reject' ? 'bg-rose-600 text-white' : 'border'} disabled:opacity-50`}>Từ chối kho</button>
              </div>
            </div>

            {activeTab === 'request' && (
              <div className="border rounded-lg p-3 space-y-3">
                <label className="flex items-center gap-2 text-sm">
                  <input type="checkbox" checked={inventoryReq.needsReplacement} onChange={(e) => setInventoryReq({ ...inventoryReq, needsReplacement: e.target.checked })} />
                  Có cần thay linh kiện (gửi kho duyệt)
                </label>

                {inventoryReq.needsReplacement && (
                  <div className="space-y-2">
                    {inventoryReq.requiredParts.map((item, index) => (
                      <div key={`part-row-${index}`} className="grid grid-cols-1 md:grid-cols-3 gap-2">
                        <select className="border rounded px-2 py-2" value={item.part} onChange={(e) => { const next = [...inventoryReq.requiredParts]; next[index] = { ...next[index], part: e.target.value }; setInventoryReq({ ...inventoryReq, requiredParts: next }); }}>
                          <option value="">Chọn linh kiện</option>
                          {parts.map((p) => (
                            <option key={p._id} value={p._id}>{p.partName}{p.brand ? ` (${p.brand})` : ''} • tồn {p.stock ?? 0}</option>
                          ))}
                        </select>
                        <input type="number" min={1} className="border rounded px-2 py-2" placeholder="Số lượng" value={item.quantity} onChange={(e) => { const next = [...inventoryReq.requiredParts]; next[index] = { ...next[index], quantity: Number(e.target.value) }; setInventoryReq({ ...inventoryReq, requiredParts: next }); }} />
                        <button type="button" onClick={() => { const next = inventoryReq.requiredParts.filter((_, i) => i !== index); setInventoryReq({ ...inventoryReq, requiredParts: next.length ? next : [{ part: '', quantity: 1, unitPrice: 0 }] }); }} className="px-2 py-2 rounded border text-red-600">Xóa</button>
                      </div>
                    ))}
                    <button type="button" onClick={() => setInventoryReq({ ...inventoryReq, requiredParts: [...inventoryReq.requiredParts, { part: '', quantity: 1, unitPrice: 0 }] })} className="text-sm text-blue-600">+ Thêm linh kiện</button>
                  </div>
                )}

                {inventoryReq.needsReplacement && <textarea className="w-full border rounded mt-2 p-2" placeholder="Ghi chú cho kho" value={inventoryReq.noteFromTechnician} onChange={(e) => setInventoryReq({ ...inventoryReq, noteFromTechnician: e.target.value })} />}
                <button onClick={submitInventoryRequest} className="mt-2 bg-amber-600 text-white px-3 py-1 rounded text-sm">{inventoryReq.needsReplacement ? 'Gửi yêu cầu kho' : 'Bỏ qua yêu cầu linh kiện'}</button>
              </div>
            )}

{activeTab === 'quote' && (
              <div className="border rounded-lg p-3 space-y-3">
                <div>
                  <div className="text-xs uppercase text-slate-500 mb-2">Linh kiện đã duyệt</div>
                  <div className="space-y-2 text-sm">
                    {(active.inventoryRequest?.requiredParts || []).length === 0 && (
                      <p className="text-slate-500">Không có linh kiện yêu cầu.</p>
                    )}
                    {(active.inventoryRequest?.requiredParts || []).map((item, index) => (
                      <div key={`approved-${index}`} className="space-y-1">
                        <div className="flex justify-between text-sm">
                          <span>{item.part?.partName || 'Linh kiện'} {item.part?.brand ? `(${item.part.brand})` : ''}</span>
                          <span>x{item.quantity || 0} • {(item.part?.price || 0).toLocaleString('vi-VN')} ₫</span>
                        </div>
                        {item.part?._id && (
                          <div className="flex items-center gap-1 flex-wrap">
                            <span className="text-xs text-slate-500">Bảo hành:</span>
                            {[0, 1, 3, 6].map((m) => (
                              <button
                                key={m}
                                type="button"
                                onClick={() => setPartsWarranty((prev) => ({ ...prev, [item.part!._id!]: m }))}
                                className={`px-2 py-0.5 rounded text-xs border transition-all ${(partsWarranty[item.part?._id ?? ''] ?? 0) === m ? 'bg-indigo-600 text-white border-indigo-600' : 'border-slate-300 text-slate-600'}`}
                              >
                                {m === 0 ? 'Không' : `${m} tháng`}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
                <input className="w-full border rounded p-2" placeholder="Chẩn đoán" value={quote.diagnosisResult} onChange={(e) => setQuote({ ...quote, diagnosisResult: e.target.value })} />
                <div className="rounded border p-2 text-sm bg-slate-50">
                  Giá linh kiện: <strong>{approvedPartsCost.toLocaleString('vi-VN')} ₫</strong>
                </div>
                <input
                  className="w-full border rounded p-2"
                  type="number"
                  placeholder="Tiền công thợ"
                  value={quote.laborCost}
                  onChange={(e) => {
                    const laborCost = e.target.value;
                    const totalCost = Number(laborCost || 0) + approvedPartsCost;
                    setQuote({
                      ...quote,
                      laborCost,
                      estimatedCost: totalCost ? String(totalCost) : '',
                    });
                  }}
                />
                <div className="rounded border p-2 text-sm bg-slate-50">
                  Chi phí ước tính: <strong>{quote.estimatedCost ? Number(quote.estimatedCost).toLocaleString('vi-VN') : 0} ₫</strong>
                </div>
                <textarea className="w-full border rounded p-2" placeholder="Mô tả công việc" value={quote.workDescription} onChange={(e) => setQuote({ ...quote, workDescription: e.target.value })} />
                <input
                  className="w-full border rounded p-2"
                  type="date"
                  min={todayString}
                  value={quote.estimatedCompletionDate}
                  onChange={(e) => setQuote({ ...quote, estimatedCompletionDate: e.target.value })}
                />
                {quoteError && <p className="text-sm text-red-600">{quoteError}</p>}
                <button
                  onClick={submitQuote}
                  disabled={active.status !== 'INVENTORY_APPROVED'}
                  className="bg-blue-600 text-white px-3 py-2 rounded text-sm disabled:opacity-50"
                >
                  Gửi báo giá qua email khách
                </button>
              </div>
            )}
            {activeTab === 'reject' && (
              <div className="border rounded-lg p-3 space-y-3">
                <textarea className="w-full border rounded p-2" rows={4} value={rejectionMessage} onChange={(e) => setRejectionMessage(e.target.value)} />
                <button onClick={sendInventoryRejection} disabled={active.status !== 'INVENTORY_REJECTED'} className="bg-rose-600 text-white px-3 py-2 rounded text-sm disabled:opacity-50">Gửi email cho khách</button>
              </div>
            )}

            {activeTab === 'warranty' && active.isWarrantyClaim && active.warrantyClaimType === 'STORE_FAULT' && (
              <div className="border border-violet-200 rounded-lg p-3 space-y-3 bg-violet-50">
                <div className="text-xs font-bold uppercase text-violet-600 mb-1">Bảo hành miễn phí — Lỗi cửa hàng</div>
                <div className="space-y-2 text-sm">
                  {(active.inventoryRequest?.requiredParts || []).length === 0 ? (
                    <p className="text-slate-500">Không có linh kiện yêu cầu.</p>
                  ) : (
                    (active.inventoryRequest?.requiredParts || []).map((item, index) => (
                      <div key={index} className="flex justify-between bg-white rounded-lg px-3 py-2 border border-violet-100">
                        <span className="font-medium">{item.part?.partName || 'Linh kiện'}{item.part?.brand ? ` (${item.part.brand})` : ''}</span>
                        <span className="text-violet-700 font-bold">x{item.quantity || 0} · Miễn phí</span>
                      </div>
                    ))
                  )}
                </div>
                <div className="rounded-lg bg-white border border-violet-200 p-2 text-xs text-violet-700">
                  Linh kiện sẽ được thay miễn phí. Sau khi hoàn thành, hệ thống tự gửi mail thông báo khách đến lấy máy.
                </div>
                <button
                  onClick={() => startWarrantyRepair(active._id).then(() => { setActive(null); setActiveTab('request'); })}
                  disabled={active.status !== 'INVENTORY_APPROVED'}
                  className="bg-violet-600 text-white px-4 py-2 rounded-lg text-sm font-semibold disabled:opacity-50 w-full"
                >
                  Bắt đầu sửa bảo hành
                </button>
              </div>
            )}

            <button onClick={() => { setActive(null); setActiveTab('request'); }} className="w-full bg-slate-200 rounded py-2">Đóng</button>
          </div>
        </div>
      )}
    </div>
  );
};