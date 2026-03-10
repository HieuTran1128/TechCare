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
  };
  technician?: { _id: string; fullName: string };
  device?: {
    brand: string;
    model: string;
    customer?: { fullName: string; email: string };
  };
}

export const TechnicianBoard: React.FC = () => {
  const { user } = useAuth();
  const isManager = user?.role === 'manager';
  const isTechnician = user?.role === 'technician';

  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [technicians, setTechnicians] = useState<any[]>([]);
  const [selectedTech, setSelectedTech] = useState('');
  const [active, setActive] = useState<Ticket | null>(null);
  const [note, setNote] = useState('');

  const [quote, setQuote] = useState({
    diagnosisResult: '',
    estimatedCost: 0,
    workDescription: '',
    estimatedCompletionDate: '',
  });

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

  useEffect(() => {
    loadTickets().catch(() => undefined);
    loadTechnicians().catch(() => undefined);
  }, [selectedTech]);

  const pendingAssign = useMemo(() => tickets.filter((t) => t.status === 'RECEIVED'), [tickets]);
  const inFlow = useMemo(
    () => tickets.filter((t) => ['MANAGER_ASSIGNED', 'WAITING_INVENTORY', 'WAITING_CUSTOMER_APPROVAL', 'APPROVED', 'IN_PROGRESS'].includes(t.status)),
    [tickets],
  );
  const done = useMemo(() => tickets.filter((t) => ['COMPLETED', 'REJECTED'].includes(t.status)), [tickets]);

  const assignTech = async (ticketId: string, technicianId: string) => {
    await axios.patch(`${API_BASE}/ticket/${ticketId}/assign`, { technicianId }, { withCredentials: true });
    loadTickets();
  };

  const submitInventoryRequest = async () => {
    if (!active) return;
    await axios.patch(`${API_BASE}/ticket/${active._id}/inventory-request`, inventoryReq, { withCredentials: true });
    setActive(null);
    loadTickets();
  };

  const submitQuote = async () => {
    if (!active) return;
    await axios.patch(`${API_BASE}/ticket/${active._id}/quotation`, quote, { withCredentials: true });
    setActive(null);
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

              {isTechnician && t.status === 'MANAGER_ASSIGNED' && (
                <button onClick={() => setActive(t)} className="mt-2 text-sm bg-blue-600 text-white px-3 py-1 rounded">Kiểm tra & yêu cầu kho / bỏ qua</button>
              )}

              {isTechnician && t.status === 'APPROVED' && (
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
            <h3 className="font-bold text-lg">Xử lý phiếu {active.ticketCode}</h3>

            <div className="border rounded-lg p-3">
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={inventoryReq.needsReplacement}
                  onChange={(e) => setInventoryReq({ ...inventoryReq, needsReplacement: e.target.checked })}
                />
                Có cần thay linh kiện (gửi inventory staff)
              </label>
              <textarea
                className="w-full border rounded mt-2 p-2"
                placeholder="Ghi chú cho kho"
                value={inventoryReq.noteFromTechnician}
                onChange={(e) => setInventoryReq({ ...inventoryReq, noteFromTechnician: e.target.value })}
              />
              <button onClick={submitInventoryRequest} className="mt-2 bg-amber-600 text-white px-3 py-1 rounded text-sm">Lưu bước kiểm tra kho</button>
            </div>

            <div className="border rounded-lg p-3">
              <input className="w-full border rounded p-2 mb-2" placeholder="Chẩn đoán" value={quote.diagnosisResult} onChange={(e) => setQuote({ ...quote, diagnosisResult: e.target.value })} />
              <input className="w-full border rounded p-2 mb-2" type="number" placeholder="Giá dự kiến" value={quote.estimatedCost} onChange={(e) => setQuote({ ...quote, estimatedCost: Number(e.target.value) })} />
              <textarea className="w-full border rounded p-2 mb-2" placeholder="Mô tả công việc" value={quote.workDescription} onChange={(e) => setQuote({ ...quote, workDescription: e.target.value })} />
              <input className="w-full border rounded p-2" type="date" value={quote.estimatedCompletionDate} onChange={(e) => setQuote({ ...quote, estimatedCompletionDate: e.target.value })} />
              <button onClick={submitQuote} className="mt-2 bg-blue-600 text-white px-3 py-1 rounded text-sm">Gửi báo giá qua email khách</button>
            </div>

            <textarea className="w-full border rounded p-2" placeholder="Ghi chú khi hoàn thành để gửi khách" value={note} onChange={(e) => setNote(e.target.value)} />

            <button onClick={() => setActive(null)} className="w-full bg-slate-200 dark:bg-slate-700 rounded py-2">Đóng</button>
          </div>
        </div>
      )}
    </div>
  );
};
