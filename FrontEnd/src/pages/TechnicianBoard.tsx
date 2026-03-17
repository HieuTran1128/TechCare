import React, { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api';

interface Ticket {
  _id: string;
  ticketCode: string;
  status: string;
  initialIssue: string;
  quote?: {
    diagnosisResult?: string;
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
    brand: string;
    model: string;
    customer?: { fullName: string; email: string };
  };
}

interface PartOption {
  _id: string;
  partName: string;
  brand?: string;
  stock?: number;
}

export const TechnicianBoard: React.FC = () => {
  const { user } = useAuth();
  const isManager = user?.role === 'manager';
  const isTechnician = user?.role === 'technician';

  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [technicians, setTechnicians] = useState<any[]>([]);
  const [parts, setParts] = useState<PartOption[]>([]);
  const [selectedTech, setSelectedTech] = useState('');
  const [active, setActive] = useState<Ticket | null>(null);
  const [activeTab, setActiveTab] = useState<'request' | 'quote' | 'reject'>('request');
  const [note, setNote] = useState('');
  const [rejectionMessage, setRejectionMessage] = useState('Hiện tại cửa hàng không có linh kiện thay thế. Mong quý khách thông cảm.');
  const [quoteError, setQuoteError] = useState('');

  const [quote, setQuote] = useState({
    diagnosisResult: '',
    laborCost: '',
    estimatedCost: '',
    workDescription: '',
    estimatedCompletionDate: '',
  });

  const approvedPartsCost = useMemo(() => {
    const requiredParts = active?.inventoryRequest?.requiredParts || [];
    return requiredParts.reduce(
      (total, item) => total + (item.part?.price || 0) * (item.quantity || 0),
      0,
    );
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
    if (isManager && selectedTech) params.technicianId = selectedTech;

    const res = await axios.get(`${API_BASE}/ticket`, { params, withCredentials: true });
    setTickets(res.data.data || []);
  };

  const loadTechnicians = async () => {
    if (!isManager) return;
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
      tickets.filter((t) =>
        [
          'DIAGNOSING',
          'WAITING_INVENTORY',
          'INVENTORY_APPROVED',
          'INVENTORY_REJECTED',
          'QUOTED',
          'CUSTOMER_APPROVED',
          'IN_PROGRESS',
        ].includes(t.status),
      ),
    [tickets],
  );
  const done = useMemo(
    () => tickets.filter((t) => ['COMPLETED', 'CUSTOMER_REJECTED'].includes(t.status)),
    [tickets],
  );

  const assignTech = async (ticketId: string, technicianId: string) => {
    await axios.patch(`${API_BASE}/ticket/${ticketId}/assign`, { technicianId }, { withCredentials: true });
    loadTickets();
  };

  const submitInventoryRequest = async () => {
    if (!active) return;
    const payload = inventoryReq.needsReplacement
      ? inventoryReq
      : { ...inventoryReq, noteFromTechnician: '', requiredParts: [] };

    await axios.patch(`${API_BASE}/ticket/${active._id}/inventory-request`, payload, { withCredentials: true });

    if (!inventoryReq.needsReplacement) {
      setActiveTab('quote');
      setActive({
        ...active,
        status: 'INVENTORY_APPROVED',
        inventoryRequest: {
          ...(active.inventoryRequest || {}),
          status: 'NOT_REQUIRED',
          requiredParts: [],
        },
      });
      loadTickets();
      return;
    }

    setActive(null);
    setActiveTab('request');
    loadTickets();
  };

  const submitQuote = async () => {
    if (!active) return;
    if (active.status !== 'INVENTORY_APPROVED') return;

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
      {
        ...quote,
        laborCost: Number(quote.laborCost || 0),
        estimatedCost: Number(quote.estimatedCost || 0),
      },
      { withCredentials: true },
    );
    setActive(null);
    setActiveTab('request');
    loadTickets();
  };

  const sendInventoryRejection = async () => {
    if (!active) return;
    if (active.status !== 'INVENTORY_REJECTED') return;
    await axios.patch(
      `${API_BASE}/ticket/${active._id}/inventory-reject-mail`,
      { message: rejectionMessage },
      { withCredentials: true },
    );
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

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Điều phối kỹ thuật</h1>
        {isManager && (
          <select value={selectedTech} onChange={(e) => setSelectedTech(e.target.value)} className="border rounded-lg px-3 py-2">
            <option value="">Tất cả kỹ thuật viên</option>
            {technicians.map((t) => (
              <option key={t._id} value={t._id}>{t.fullName}</option>
            ))}
          </select>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <section className="bg-white dark:bg-slate-900 border rounded-xl p-4">
          <h2 className="font-semibold mb-3">Chờ manager phân công</h2>
          {pendingAssign.map((t) => (
            <div key={t._id} className="border rounded-lg p-3 mb-3">
              <p className="font-semibold">{t.ticketCode}</p>
              <p className="text-sm">{t.device?.brand} {t.device?.model}</p>
              <p className="text-xs text-slate-500">{t.initialIssue}</p>
              {isManager && (
                <select
                  defaultValue=""
                  onChange={(e) => e.target.value && assignTech(t._id, e.target.value)}
                  className="w-full mt-2 border rounded px-2 py-1"
                >
                  <option value="">Phân công kỹ thuật viên</option>
                  {technicians.map((tech) => (
                    <option key={tech._id} value={tech._id}>{tech.fullName}</option>
                  ))}
                </select>
              )}
            </div>
          ))}
        </section>

        <section className="bg-white dark:bg-slate-900 border rounded-xl p-4">
          <h2 className="font-semibold mb-3">Đang xử lý nghiệp vụ</h2>
          {inFlow.map((t) => (
            <div key={t._id} className="border rounded-lg p-3 mb-3">
              <p className="font-semibold">{t.ticketCode}</p>
              <p className="text-xs mb-1">Trạng thái: {t.status}</p>
              <p className="text-sm">{t.device?.customer?.fullName}</p>

              {isTechnician && t.status === 'DIAGNOSING' && (
                <button
                  onClick={() => {
                    setActive(t);
                    setActiveTab('request');
                    setQuote({
                      diagnosisResult: '',
                      laborCost: '',
                      estimatedCost: '',
                      workDescription: '',
                      estimatedCompletionDate: '',
                    });
                    setQuoteError('');
                  }}
                  className="mt-2 text-sm bg-blue-600 text-white px-3 py-1 rounded"
                >
                  Chẩn đoán & gửi yêu cầu kho
                </button>
              )}

              {isTechnician && t.status === 'INVENTORY_APPROVED' && (
                <button
                  onClick={() => {
                    const existingQuote = t.quote || {};
                    const laborValue = existingQuote.laborCost ?? existingQuote.estimatedCost;
                    const laborCost = laborValue ? String(laborValue) : '';
                    const totalCost = Number(laborValue || 0) + approvedPartsCost;
                    setQuote({
                      diagnosisResult: existingQuote.diagnosisResult || '',
                      laborCost,
                      estimatedCost: totalCost ? String(totalCost) : '',
                      workDescription: existingQuote.workDescription || '',
                      estimatedCompletionDate: existingQuote.estimatedCompletionDate ? String(existingQuote.estimatedCompletionDate).slice(0, 10) : '',
                    });
                    setQuoteError('');
                    setActive(t);
                    setActiveTab('quote');
                  }}
                  className="mt-2 text-sm bg-purple-600 text-white px-3 py-1 rounded"
                >
                  Nhập báo giá
                </button>
              )}

              {isTechnician && t.status === 'INVENTORY_REJECTED' && (
                <button
                  onClick={() => {
                    setActive(t);
                    setActiveTab('reject');
                    setRejectionMessage('Hiện tại cửa hàng không có linh kiện thay thế. Mong quý khách thông cảm.');
                  }}
                  className="mt-2 text-sm bg-rose-600 text-white px-3 py-1 rounded"
                >
                  Gửi thông báo cho khách
                </button>
              )}

              {isTechnician && t.status === 'CUSTOMER_APPROVED' && (
                <button onClick={() => startRepair(t._id)} className="mt-2 text-sm bg-emerald-600 text-white px-3 py-1 rounded">Bắt đầu sửa</button>
              )}

              {isTechnician && t.status === 'IN_PROGRESS' && (
                <button onClick={() => complete(t._id)} className="mt-2 text-sm bg-indigo-600 text-white px-3 py-1 rounded">Hoàn thành & gửi mail lấy máy</button>
              )}
            </div>
          ))}
        </section>

        <section className="bg-white dark:bg-slate-900 border rounded-xl p-4">
          <h2 className="font-semibold mb-3">Hoàn thành / Từ chối</h2>
          {done.map((t) => (
            <div key={t._id} className="border rounded-lg p-3 mb-3">
              <p className="font-semibold">{t.ticketCode}</p>
              <p className="text-xs">{t.status}</p>
              <p className="text-sm">{t.device?.customer?.fullName}</p>
            </div>
          ))}
        </section>
      </div>

      {active && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-slate-900 w-full max-w-xl rounded-xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-lg">Xử lý phiếu {active.ticketCode}</h3>
              <div className="flex gap-2">
                <button
                  onClick={() => setActiveTab('request')}
                  className={`px-3 py-1 rounded-lg text-sm ${activeTab === 'request' ? 'bg-blue-600 text-white' : 'border'}`}
                >
                  Yêu cầu kho
                </button>
                <button
                  onClick={() => setActiveTab('quote')}
                  disabled={active.status !== 'INVENTORY_APPROVED'}
                  className={`px-3 py-1 rounded-lg text-sm ${activeTab === 'quote' ? 'bg-purple-600 text-white' : 'border'} disabled:opacity-50`}
                >
                  Báo giá
                </button>
                <button
                  onClick={() => setActiveTab('reject')}
                  disabled={active.status !== 'INVENTORY_REJECTED'}
                  className={`px-3 py-1 rounded-lg text-sm ${activeTab === 'reject' ? 'bg-rose-600 text-white' : 'border'} disabled:opacity-50`}
                >
                  Từ chối kho
                </button>
              </div>
            </div>

            {activeTab === 'request' && (
              <div className="border rounded-lg p-3 space-y-3">
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={inventoryReq.needsReplacement}
                    onChange={(e) => setInventoryReq({ ...inventoryReq, needsReplacement: e.target.checked })}
                  />
                  Có cần thay linh kiện (gửi kho duyệt)
                </label>

                {inventoryReq.needsReplacement && (
                  <div className="space-y-2">
                    {inventoryReq.requiredParts.map((item, index) => (
                      <div key={`part-row-${index}`} className="grid grid-cols-1 md:grid-cols-3 gap-2">
                        <select
                          className="border rounded px-2 py-2"
                          value={item.part}
                          onChange={(e) => {
                            const next = [...inventoryReq.requiredParts];
                            next[index] = { ...next[index], part: e.target.value };
                            setInventoryReq({ ...inventoryReq, requiredParts: next });
                          }}
                        >
                          <option value="">Chọn linh kiện</option>
                          {parts.map((p) => (
                            <option key={p._id} value={p._id}>
                              {p.partName}{p.brand ? ` (${p.brand})` : ''} • tồn {p.stock ?? 0}
                            </option>
                          ))}
                        </select>
                        <input
                          type="number"
                          min={1}
                          className="border rounded px-2 py-2"
                          placeholder="Số lượng"
                          value={item.quantity}
                          onChange={(e) => {
                            const next = [...inventoryReq.requiredParts];
                            next[index] = { ...next[index], quantity: Number(e.target.value) };
                            setInventoryReq({ ...inventoryReq, requiredParts: next });
                          }}
                        />
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              const next = inventoryReq.requiredParts.filter((_, i) => i !== index);
                              setInventoryReq({ ...inventoryReq, requiredParts: next.length ? next : [{ part: '', quantity: 1, unitPrice: 0 }] });
                            }}
                            className="px-2 py-2 rounded border text-red-600 w-full"
                          >
                            Xóa
                          </button>
                        </div>
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={() => setInventoryReq({
                        ...inventoryReq,
                        requiredParts: [...inventoryReq.requiredParts, { part: '', quantity: 1, unitPrice: 0 }],
                      })}
                      className="text-sm text-blue-600"
                    >
                      + Thêm linh kiện
                    </button>
                  </div>
                )}

                {inventoryReq.needsReplacement && (
                  <textarea
                    className="w-full border rounded mt-2 p-2"
                    placeholder="Ghi chú cho kho"
                    value={inventoryReq.noteFromTechnician}
                    onChange={(e) => setInventoryReq({ ...inventoryReq, noteFromTechnician: e.target.value })}
                  />
                )}
                <button onClick={submitInventoryRequest} className="mt-2 bg-amber-600 text-white px-3 py-1 rounded text-sm">
                  {inventoryReq.needsReplacement ? 'Gửi yêu cầu kho' : 'Bỏ qua yêu cầu linh kiện'}
                </button>
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
                      <div key={`approved-${index}`} className="flex justify-between">
                        <span>{item.part?.partName || 'Linh kiện'} {item.part?.brand ? `(${item.part.brand})` : ''}</span>
                        <span>
                          x{item.quantity || 0} • {(item.part?.price || 0).toLocaleString('vi-VN')} ₫
                        </span>
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
                <div className="text-xs uppercase text-slate-500">Thông báo khách hàng</div>
                <textarea
                  className="w-full border rounded p-2"
                  rows={4}
                  value={rejectionMessage}
                  onChange={(e) => setRejectionMessage(e.target.value)}
                />
                <button
                  onClick={sendInventoryRejection}
                  disabled={active.status !== 'INVENTORY_REJECTED'}
                  className="bg-rose-600 text-white px-3 py-2 rounded text-sm disabled:opacity-50"
                >
                  Gửi email cho khách
                </button>
              </div>
            )}

            <button onClick={() => { setActive(null); setActiveTab('request'); }} className="w-full bg-slate-200 dark:bg-slate-700 rounded py-2">Đóng</button>
          </div>
        </div>
      )}
    </div>
  );
};
