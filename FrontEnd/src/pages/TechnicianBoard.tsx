import React, { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { useTickets } from '../hooks';
import { ticketService, warrantyService, userService, inventoryService } from '../services';
import { StatusBadge } from '../components/ui';
import type { Ticket } from '../types';

const TIMELINE = ['RECEIVED', 'DIAGNOSING', 'WAITING_INVENTORY', 'INVENTORY_APPROVED', 'QUOTED', 'IN_PROGRESS', 'COMPLETED'];

export const TechnicianBoard: React.FC = () => {
  const { user } = useAuth();
  const isFrontdesk = user?.role === 'frontdesk';
  const isTechnician = user?.role === 'technician';

  const [selectedTech, setSelectedTech] = useState('');
  const { tickets, reload: reloadTickets } = useTickets({ limit: 100, sort: '-createdAt', technicianId: isFrontdesk && selectedTech ? selectedTech : undefined });

  const [technicians, setTechnicians] = useState<any[]>([]);
  const [parts, setParts] = useState<{ _id: string; partName: string; brand?: string; stock?: number }[]>([]);
  const [active, setActive] = useState<Ticket | null>(null);
  const [activeTab, setActiveTab] = useState<'request' | 'quote' | 'reject' | 'warranty'>('request');
  const [note, setNote] = useState('');
  const [rejectionMessage, setRejectionMessage] = useState('Hiện tại cửa hàng không có linh kiện thay thế. Mong quý khách thông cảm.');
  const [quoteError, setQuoteError] = useState('');
  const [doneSearch, setDoneSearch] = useState('');
  const [donePage, setDonePage] = useState(1);
  const donePageSize = 6;
  const [partsWarranty, setPartsWarranty] = useState<Record<string, number>>({});
  const [quote, setQuote] = useState({ diagnosisResult: '', laborCost: '', estimatedCost: '', workDescription: '', estimatedCompletionDate: '' });
  const [inventoryReq, setInventoryReq] = useState({ needsReplacement: false, noteFromTechnician: '', requiredParts: [{ part: '', quantity: 1, unitPrice: 0 }] });

  const approvedPartsCost = useMemo(() => {
    return (active?.inventoryRequest?.requiredParts || []).reduce((total, item) => total + (item.part?.price || 0) * (item.quantity || 0), 0);
  }, [active]);

  const todayString = useMemo(() => {
    const today = new Date();
    return new Date(today.getTime() - today.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
  }, []);

  useEffect(() => {
    if (isFrontdesk) {
      userService.getAll()
        .then((data) => setTechnicians((data as any[]).filter((u: any) => u.role === 'technician')))
        .catch(() => undefined);
    }
    inventoryService.getAllParts()
      .then(setParts)
      .catch(() => undefined);
  }, [isFrontdesk]);

  const pendingAssign = useMemo(() => tickets.filter((t) => t.status === 'RECEIVED'), [tickets]);
  const inFlow = useMemo(() => tickets.filter((t) => ['DIAGNOSING', 'WAITING_INVENTORY', 'INVENTORY_APPROVED', 'INVENTORY_REJECTED', 'QUOTED', 'CUSTOMER_APPROVED', 'IN_PROGRESS'].includes(t.status)), [tickets]);
  const doneRaw = useMemo(() => tickets.filter((t) => ['COMPLETED', 'PAYMENTED', 'CUSTOMER_REJECTED', 'DONE_INVENTORY_REJECTED', 'WARRANTY_DONE'].includes(t.status)), [tickets]);

  const done = useMemo(() => {
    const q = doneSearch.trim().toLowerCase();
    if (!q) return doneRaw;
    return doneRaw.filter((t) => {
      const code = (t.ticketCode || '').toLowerCase();
      const customer = (t.device?.customer?.fullName || '').toLowerCase();
      const device = `${t.device?.deviceType || ''} ${t.device?.brand || ''} ${t.device?.model || ''}`.toLowerCase();
      return code.includes(q) || customer.includes(q) || device.includes(q);
    });
  }, [doneRaw, doneSearch]);

  const doneTotalPages = Math.max(1, Math.ceil(done.length / donePageSize));
  const donePaged = useMemo(() => done.slice((donePage - 1) * donePageSize, donePage * donePageSize), [done, donePage]);

  useEffect(() => { setDonePage(1); }, [doneSearch]);
  useEffect(() => { if (donePage > doneTotalPages) setDonePage(doneTotalPages); }, [donePage, doneTotalPages]);

  const assignTech = async (ticketId: string, technicianId: string) => {
    await ticketService.assign(ticketId, technicianId);
    reloadTickets();
  };

  const submitInventoryRequest = async () => {
    if (!active) return;
    const payload = inventoryReq.needsReplacement ? inventoryReq : { ...inventoryReq, noteFromTechnician: '', requiredParts: [] };
    await ticketService.submitInventoryRequest(active._id, payload);
    if (!inventoryReq.needsReplacement) {
      setActiveTab('quote');
      setActive({ ...active, status: 'INVENTORY_APPROVED', inventoryRequest: { ...(active.inventoryRequest || {}), status: 'NOT_REQUIRED', requiredParts: [] } });
      reloadTickets();
      return;
    }
    setActive(null);
    setActiveTab('request');
    reloadTickets();
  };

  const submitQuote = async () => {
    if (!active || active.status !== 'INVENTORY_APPROVED') return;
    const selectedDate = quote.estimatedCompletionDate ? new Date(quote.estimatedCompletionDate) : null;
    const today = new Date(); today.setHours(0, 0, 0, 0);
    if (selectedDate && selectedDate.getTime() < today.getTime()) { setQuoteError('Ngày dự kiến hoàn thành không được ở quá khứ.'); return; }
    setQuoteError('');
    await ticketService.submitQuote(active._id, { ...quote, laborCost: Number(quote.laborCost || 0), estimatedCost: Number(quote.estimatedCost || 0), partsWarranty: Object.entries(partsWarranty).map(([partId, warrantyMonths]) => ({ partId, warrantyMonths })) });
    setActive(null); setActiveTab('request'); setPartsWarranty({}); reloadTickets();
  };

  const sendInventoryRejection = async () => {
    if (!active || active.status !== 'INVENTORY_REJECTED') return;
    await ticketService.sendInventoryRejectionEmail(active._id, rejectionMessage);
    setActive(null); setActiveTab('request'); reloadTickets();
  };

  const startRepair = async (id: string) => { await ticketService.startRepair(id); reloadTickets(); };
  const complete = async (id: string) => { await ticketService.complete(id, { pickupNote: note, usedParts: [], finalCost: 0 }); setNote(''); reloadTickets(); };
  const completeWarranty = async (id: string) => { await warrantyService.completeTicket(id); reloadTickets(); };
  const startWarrantyRepair = async (id: string) => { await warrantyService.startTicket(id); reloadTickets(); };

  const renderTimeline = (status: string) => {
    const idx = TIMELINE.indexOf(status);
    return (
      <div className="flex gap-1 mt-2">
        {TIMELINE.map((_, i) => <div key={i} className={`h-1.5 flex-1 rounded-full ${idx >= i ? 'bg-indigo-500' : 'bg-slate-200'}`} />)}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {isFrontdesk && (
        <div className="flex justify-end">
          <select value={selectedTech} onChange={(e) => setSelectedTech(e.target.value)} className="border rounded-xl px-3 py-2 bg-white">
            <option value="">Tất cả kỹ thuật viên</option>
            {technicians.map((t) => <option key={t._id} value={t._id}>{t.fullName}</option>)}
          </select>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Pending */}
        <section className="bg-white border rounded-2xl p-4">
          <h2 className="font-semibold mb-3">Chờ phân công</h2>
          {pendingAssign.map((t) => (
            <div key={t._id} className="border rounded-xl p-3 mb-3">
              <p className="font-semibold">{t.ticketCode}</p>
              <p className="text-sm">{t.device?.deviceType || '-'} • {t.device?.brand || '-'} • {t.device?.model || '-'}</p>
              <p className="text-xs text-slate-500">{t.initialIssue}</p>
              {isFrontdesk && (
                <select defaultValue="" onChange={(e) => e.target.value && assignTech(t._id, e.target.value)} className="w-full mt-2 border rounded-lg px-2 py-1 text-sm">
                  <option value="">Phân công kỹ thuật viên</option>
                  {technicians.map((tech) => <option key={tech._id} value={tech._id}>{tech.fullName}</option>)}
                </select>
              )}
            </div>
          ))}
          {pendingAssign.length === 0 && <p className="text-sm text-slate-400 text-center py-4">Không có phiếu chờ</p>}
        </section>

        {/* In Progress */}
        <section className="bg-white border rounded-2xl p-4">
          <h2 className="font-semibold mb-3">Đang xử lý</h2>
          {inFlow.map((t) => (
            <motion.div key={t._id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="border rounded-xl p-3 mb-3">
              <p className="font-semibold">{t.ticketCode}</p>
              <div className="flex items-center gap-1 mb-1 flex-wrap">
                <StatusBadge status={t.status} />
                {t.isWarrantyClaim && <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-violet-100 text-violet-700">BẢO HÀNH</span>}
              </div>
              {renderTimeline(t.status)}
              <p className="text-sm mt-2">{t.device?.customer?.fullName}</p>
              <p className="text-xs text-slate-500">{t.device?.deviceType || '-'} • {t.device?.brand || '-'} • {t.device?.model || '-'}</p>
              <p className="text-xs text-slate-500">{t.initialIssue}</p>
              {isTechnician && t.status === 'DIAGNOSING' && (
                <button onClick={() => { setActive(t); setActiveTab('request'); setQuote({ diagnosisResult: '', laborCost: '', estimatedCost: '', workDescription: '', estimatedCompletionDate: '' }); setQuoteError(''); }} className="mt-2 text-sm bg-blue-600 text-white px-3 py-1 rounded-lg">Chẩn đoán & gửi yêu cầu kho</button>
              )}
              {isTechnician && t.status === 'INVENTORY_APPROVED' && (
                <button onClick={() => { setActive(t); if (t.isWarrantyClaim && t.warrantyClaimType === 'STORE_FAULT') { setActiveTab('warranty'); } else { const eq = t.quote || {}; const lv = eq.laborCost ?? eq.estimatedCost; const lc = lv ? String(lv) : ''; const tc = Number(lv || 0) + approvedPartsCost; setQuote({ diagnosisResult: eq.diagnosisResult || '', laborCost: lc, estimatedCost: tc ? String(tc) : '', workDescription: eq.workDescription || '', estimatedCompletionDate: eq.estimatedCompletionDate ? String(eq.estimatedCompletionDate).slice(0, 10) : '' }); setQuoteError(''); setActiveTab('quote'); } }} className={`mt-2 text-sm text-white px-3 py-1 rounded-lg ${t.isWarrantyClaim && t.warrantyClaimType === 'STORE_FAULT' ? 'bg-violet-600' : 'bg-purple-600'}`}>{t.isWarrantyClaim && t.warrantyClaimType === 'STORE_FAULT' ? 'Xử lý bảo hành' : 'Nhập báo giá'}</button>
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
          {inFlow.length === 0 && <p className="text-sm text-slate-400 text-center py-4">Không có phiếu đang xử lý</p>}
        </section>

        {/* Done */}
        <section className="bg-white border rounded-2xl p-4">
          <div className="flex items-center justify-between mb-3 gap-2">
            <h2 className="font-semibold">Hoàn tất / Từ chối</h2>
            <input value={doneSearch} onChange={(e) => setDoneSearch(e.target.value)} placeholder="Tìm mã phiếu / khách" className="border rounded-lg px-2.5 py-1.5 text-xs bg-white w-44" />
          </div>
          {donePaged.map((t) => (
            <div key={t._id} className="border rounded-xl p-3 mb-3">
              <div className="flex items-start justify-between gap-2 mb-1">
                <p className="font-bold text-slate-900">{t.ticketCode}</p>
                <StatusBadge status={t.status} />
              </div>
              <p className="text-sm">{t.device?.customer?.fullName}</p>
              <p className="text-xs text-slate-500">{t.device?.deviceType || '-'} • {t.device?.brand || '-'} • {t.device?.model || '-'}</p>
            </div>
          ))}
          {donePaged.length === 0 && <p className="text-sm text-slate-400 text-center py-4">Không có phiếu</p>}
          <div className="flex items-center justify-between text-xs text-slate-500 mt-2">
            <span>Trang {donePage}/{doneTotalPages}</span>
            <div className="flex gap-1">
              <button onClick={() => setDonePage((p) => Math.max(1, p - 1))} disabled={donePage <= 1} className="px-2 py-1 border rounded disabled:opacity-40">Trước</button>
              <button onClick={() => setDonePage((p) => Math.min(doneTotalPages, p + 1))} disabled={donePage >= doneTotalPages} className="px-2 py-1 border rounded disabled:opacity-40">Sau</button>
            </div>
          </div>
        </section>
      </div>

      {/* Action Modal */}
      {active && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
          <div className="bg-white w-full max-w-xl rounded-2xl p-5 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between gap-2">
              <div>
                <h3 className="font-bold text-lg">Xử lý phiếu {active.ticketCode}</h3>
                <p className="text-xs text-slate-500">{active.device?.deviceType || '-'} • {active.device?.brand || '-'} • {active.device?.model || '-'}</p>
                <p className="text-xs text-slate-600 mt-1">{active.initialIssue}</p>
              </div>
              <div className="flex flex-wrap gap-1.5">
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
                <label className="flex items-center gap-2 text-sm cursor-pointer">
                  <input type="checkbox" checked={inventoryReq.needsReplacement} onChange={(e) => setInventoryReq({ ...inventoryReq, needsReplacement: e.target.checked })} />
                  Có cần thay linh kiện (gửi kho duyệt)
                </label>
                {inventoryReq.needsReplacement && (
                  <div className="space-y-2">
                    {inventoryReq.requiredParts.map((item, index) => (
                      <div key={index} className="grid grid-cols-3 gap-2">
                        <select className="border rounded px-2 py-2 text-sm col-span-2" value={item.part} onChange={(e) => { const next = [...inventoryReq.requiredParts]; next[index] = { ...next[index], part: e.target.value }; setInventoryReq({ ...inventoryReq, requiredParts: next }); }}>
                          <option value="">Chọn linh kiện</option>
                          {parts.map((p) => <option key={p._id} value={p._id}>{p.partName}{p.brand ? ` (${p.brand})` : ''} • tồn {p.stock ?? 0}</option>)}
                        </select>
                        <input type="number" min={1} className="border rounded px-2 py-2 text-sm" placeholder="SL" value={item.quantity} onChange={(e) => { const next = [...inventoryReq.requiredParts]; next[index] = { ...next[index], quantity: Number(e.target.value) }; setInventoryReq({ ...inventoryReq, requiredParts: next }); }} />
                      </div>
                    ))}
                    <button type="button" onClick={() => setInventoryReq({ ...inventoryReq, requiredParts: [...inventoryReq.requiredParts, { part: '', quantity: 1, unitPrice: 0 }] })} className="text-sm text-blue-600">+ Thêm linh kiện</button>
                    <textarea className="w-full border rounded p-2 text-sm" placeholder="Ghi chú cho kho" value={inventoryReq.noteFromTechnician} onChange={(e) => setInventoryReq({ ...inventoryReq, noteFromTechnician: e.target.value })} />
                  </div>
                )}
                <button onClick={submitInventoryRequest} className="bg-amber-600 text-white px-3 py-1.5 rounded text-sm">{inventoryReq.needsReplacement ? 'Gửi yêu cầu kho' : 'Bỏ qua yêu cầu linh kiện'}</button>
              </div>
            )}

            {activeTab === 'quote' && (
              <div className="border rounded-lg p-3 space-y-3">
                <div className="text-xs uppercase text-slate-500 mb-1">Linh kiện đã duyệt</div>
                {(active.inventoryRequest?.requiredParts || []).map((item, index) => (
                  <div key={index} className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span>{item.part?.partName || 'Linh kiện'} {item.part?.brand ? `(${item.part.brand})` : ''}</span>
                      <span>x{item.quantity || 0} • {(item.part?.price || 0).toLocaleString('vi-VN')} ₫</span>
                    </div>
                    {item.part?._id && (
                      <div className="flex items-center gap-1 flex-wrap">
                        <span className="text-xs text-slate-500">Bảo hành:</span>
                        {[0, 1, 3, 6].map((m) => (
                          <button key={m} type="button" onClick={() => setPartsWarranty((prev) => ({ ...prev, [item.part!._id!]: m }))} className={`px-2 py-0.5 rounded text-xs border ${(partsWarranty[item.part?._id ?? ''] ?? 0) === m ? 'bg-indigo-600 text-white border-indigo-600' : 'border-slate-300 text-slate-600'}`}>{m === 0 ? 'Không' : `${m} tháng`}</button>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
                {(active.inventoryRequest?.requiredParts || []).length === 0 && <p className="text-sm text-slate-500">Không có linh kiện yêu cầu.</p>}
                <div className="rounded border p-2 text-sm bg-slate-50">Giá linh kiện: <strong>{approvedPartsCost.toLocaleString('vi-VN')} ₫</strong></div>
                <input className="w-full border rounded p-2 text-sm" placeholder="Chẩn đoán" value={quote.diagnosisResult} onChange={(e) => setQuote({ ...quote, diagnosisResult: e.target.value })} />
                <input className="w-full border rounded p-2 text-sm" type="number" placeholder="Tiền công thợ" value={quote.laborCost} onChange={(e) => { const lc = e.target.value; setQuote({ ...quote, laborCost: lc, estimatedCost: String(Number(lc || 0) + approvedPartsCost) }); }} />
                <div className="rounded border p-2 text-sm bg-slate-50">Chi phí ước tính: <strong>{quote.estimatedCost ? Number(quote.estimatedCost).toLocaleString('vi-VN') : 0} ₫</strong></div>
                <textarea className="w-full border rounded p-2 text-sm" placeholder="Mô tả công việc" value={quote.workDescription} onChange={(e) => setQuote({ ...quote, workDescription: e.target.value })} />
                <input className="w-full border rounded p-2 text-sm" type="date" min={todayString} value={quote.estimatedCompletionDate} onChange={(e) => setQuote({ ...quote, estimatedCompletionDate: e.target.value })} />
                {quoteError && <p className="text-sm text-red-600">{quoteError}</p>}
                <button onClick={submitQuote} disabled={active.status !== 'INVENTORY_APPROVED'} className="bg-blue-600 text-white px-3 py-2 rounded text-sm disabled:opacity-50">Gửi báo giá qua email khách</button>
              </div>
            )}

            {activeTab === 'reject' && (
              <div className="border rounded-lg p-3 space-y-3">
                <textarea className="w-full border rounded p-2 text-sm" rows={4} value={rejectionMessage} onChange={(e) => setRejectionMessage(e.target.value)} />
                <button onClick={sendInventoryRejection} disabled={active.status !== 'INVENTORY_REJECTED'} className="bg-rose-600 text-white px-3 py-2 rounded text-sm disabled:opacity-50">Gửi email cho khách</button>
              </div>
            )}

            {activeTab === 'warranty' && active.isWarrantyClaim && active.warrantyClaimType === 'STORE_FAULT' && (
              <div className="border border-violet-200 rounded-lg p-3 space-y-3 bg-violet-50">
                <div className="text-xs font-bold uppercase text-violet-600">Bảo hành miễn phí — Lỗi cửa hàng</div>
                {(active.inventoryRequest?.requiredParts || []).map((item, index) => (
                  <div key={index} className="flex justify-between bg-white rounded-lg px-3 py-2 border border-violet-100 text-sm">
                    <span className="font-medium">{item.part?.partName || 'Linh kiện'}{item.part?.brand ? ` (${item.part.brand})` : ''}</span>
                    <span className="text-violet-700 font-bold">x{item.quantity || 0} · Miễn phí</span>
                  </div>
                ))}
                <button onClick={() => startWarrantyRepair(active._id).then(() => { setActive(null); setActiveTab('request'); })} disabled={active.status !== 'INVENTORY_APPROVED'} className="bg-violet-600 text-white px-4 py-2 rounded-lg text-sm font-semibold disabled:opacity-50 w-full">Bắt đầu sửa bảo hành</button>
              </div>
            )}

            <button onClick={() => { setActive(null); setActiveTab('request'); }} className="w-full bg-slate-200 rounded py-2 text-sm">Đóng</button>
          </div>
        </div>
      )}
    </div>
  );
};
