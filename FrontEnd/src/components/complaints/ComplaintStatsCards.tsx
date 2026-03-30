import React from 'react';
import type { ComplaintStats } from '../../types';

interface ComplaintStatsCardsProps {
  stats: ComplaintStats;
}

export const ComplaintStatsCards: React.FC<ComplaintStatsCardsProps> = ({ stats }) => {
  const cards = [
    { label: 'Tổng khiếu nại', value: stats.total, color: 'text-slate-700', bg: 'bg-white' },
    { label: 'Mới / Chưa xử lý', value: stats.open, color: 'text-rose-600', bg: 'bg-rose-50' },
    { label: 'Đang xử lý', value: stats.inProgress, color: 'text-amber-600', bg: 'bg-amber-50' },
    { label: 'Đã đóng', value: stats.closed, color: 'text-emerald-600', bg: 'bg-emerald-50' },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      {cards.map((s) => (
        <div key={s.label} className={`${s.bg} border rounded-xl p-4`}>
          <p className="text-xs text-slate-500 mb-1">{s.label}</p>
          <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
        </div>
      ))}
    </div>
  );
};
