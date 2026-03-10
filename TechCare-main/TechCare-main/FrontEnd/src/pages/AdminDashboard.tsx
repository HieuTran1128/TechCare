import React, { useEffect, useState } from 'react';
import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api';

interface Summary {
  totalTickets: number;
  completedTickets: number;
  rejectedTickets: number;
  totalRevenue: number;
}

export const AdminDashboard: React.FC = () => {
  const [summary, setSummary] = useState<Summary>({
    totalTickets: 0,
    completedTickets: 0,
    rejectedTickets: 0,
    totalRevenue: 0,
  });

  const [latest, setLatest] = useState<any[]>([]);

  useEffect(() => {
    const load = async () => {
      const [s, t] = await Promise.all([
        axios.get(`${API_BASE}/ticket/manager/summary`, { withCredentials: true }),
        axios.get(`${API_BASE}/ticket?limit=8&sort=-createdAt`, { withCredentials: true }),
      ]);
      setSummary(s.data);
      setLatest(t.data.data || []);
    };

    load().catch(() => undefined);
  }, []);

  const stats = [
    { label: 'Tổng đơn', value: summary.totalTickets },
    { label: 'Hoàn thành', value: summary.completedTickets },
    { label: 'Từ chối', value: summary.rejectedTickets },
    { label: 'Doanh thu', value: `${summary.totalRevenue.toLocaleString('vi-VN')} ₫` },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Bảng điều khiển manager</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        {stats.map((s) => (
          <div key={s.label} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4">
            <p className="text-sm text-slate-500">{s.label}</p>
            <p className="text-2xl font-bold mt-2">{s.value}</p>
          </div>
        ))}
      </div>

      <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4">
        <h2 className="font-semibold mb-3">Danh sách đơn gần đây</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-slate-500 border-b">
                <th className="py-2">Mã phiếu</th>
                <th>Khách hàng</th>
                <th>Thiết bị</th>
                <th>Trạng thái</th>
                <th>Chi phí cuối</th>
              </tr>
            </thead>
            <tbody>
              {latest.map((t) => (
                <tr key={t._id} className="border-b border-slate-100 dark:border-slate-800">
                  <td className="py-2 font-medium">{t.ticketCode}</td>
                  <td>{t.device?.customer?.fullName || '-'}</td>
                  <td>{t.device?.brand} {t.device?.model}</td>
                  <td>{t.status}</td>
                  <td>{(t.finalCost || 0).toLocaleString('vi-VN')} ₫</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
};
