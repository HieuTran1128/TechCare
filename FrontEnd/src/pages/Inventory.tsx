import React, { useEffect, useState } from 'react';
import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api';

interface Ticket {
  _id: string;
  ticketCode: string;
  status: string;
  inventoryRequest?: {
    status?: string;
    noteFromTechnician?: string;
    requiredParts?: Array<{ part?: string; quantity?: number }>;
  };
  device?: { brand: string; model: string; customer?: { fullName: string } };
}

export const Inventory: React.FC = () => {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API_BASE}/ticket?limit=100`, { withCredentials: true });
      const all = res.data.data || [];
      setTickets(all.filter((t: Ticket) => t.inventoryRequest?.status === 'PENDING'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const respond = async (id: string, available: boolean) => {
    await axios.patch(
      `${API_BASE}/ticket/${id}/inventory-response`,
      {
        available,
        noteFromStorekeeper: available
          ? 'Kho đã xác nhận có linh kiện theo yêu cầu.'
          : 'Kho hiện không đủ linh kiện theo yêu cầu.',
      },
      { withCredentials: true },
    );
    load();
  };

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Kho linh kiện - phản hồi yêu cầu kỹ thuật</h1>

      {loading && <p>Đang tải...</p>}

      {!loading && tickets.length === 0 && (
        <div className="bg-white dark:bg-slate-900 border rounded-xl p-6">Không có yêu cầu kho đang chờ xử lý.</div>
      )}

      <div className="grid gap-4">
        {tickets.map((t) => (
          <div key={t._id} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4">
            <div className="flex justify-between items-start">
              <div>
                <p className="font-semibold">{t.ticketCode}</p>
                <p className="text-sm text-slate-600 dark:text-slate-300">
                  {t.device?.brand} {t.device?.model} - Khách: {t.device?.customer?.fullName || 'N/A'}
                </p>
                <p className="text-sm mt-2">Ghi chú kỹ thuật: {t.inventoryRequest?.noteFromTechnician || 'Không có'}</p>
              </div>
              <p className="text-xs px-2 py-1 rounded bg-amber-100 text-amber-700">PENDING</p>
            </div>

            <div className="mt-3 flex gap-2">
              <button onClick={() => respond(t._id, true)} className="bg-emerald-600 text-white px-3 py-1.5 rounded">
                Có linh kiện
              </button>
              <button onClick={() => respond(t._id, false)} className="bg-red-600 text-white px-3 py-1.5 rounded">
                Không có linh kiện
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
