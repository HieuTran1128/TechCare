import React, { useState, useEffect, useMemo } from 'react';
import { Calendar as CalendarIcon, Users } from 'lucide-react';
import { scheduleService } from '../services';
import type { WorkSchedule } from '../services/schedule.service';

export const ManagerSchedule: React.FC = () => {
  const [schedules, setSchedules] = useState<WorkSchedule[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);

  useEffect(() => {
    fetchAllSchedules();
  }, [selectedDate]);

  const fetchAllSchedules = async () => {
    try {
      setLoading(true);
      const data = await scheduleService.getAll(selectedDate, selectedDate);
      setSchedules(data);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  };

  // Previous days + today + next days for selector
  const daysSelector = useMemo(() => {
    const today = new Date();
    return Array.from({ length: 9 }).map((_, i) => {
      const d = new Date(today);
      d.setDate(today.getDate() - 2 + i);
      const iso = d.toISOString().split('T')[0];
      const isToday = i === 2;
      return {
        iso,
        label: isToday ? 'Hôm nay' : d.toLocaleDateString('vi-VN', { weekday: 'short', day: '2-digit', month: '2-digit' }),
      };
    });
  }, []);

  const morningSchedules = schedules.filter(s => s.shift === 'morning');
  const afternoonSchedules = schedules.filter(s => s.shift === 'afternoon');

  const getRoleColor = (role: string) => {
    if (role === 'technician') return 'bg-orange-100 text-orange-700';
    if (role === 'frontdesk') return 'bg-purple-100 text-purple-700';
    if (role === 'storekeeper') return 'bg-emerald-100 text-emerald-700';
    return 'bg-slate-100 text-slate-700';
  };

  const StaffCard = ({ s }: { s: WorkSchedule }) => {
    if (!s.userId) return null;
    return (
      <div key={s._id} className="flex items-center gap-3 bg-slate-50 p-3 rounded-lg border border-slate-100">
        <img src={s.userId.avatar || `https://i.pravatar.cc/150?u=${s.userId._id}`} alt="avatar" className="w-10 h-10 rounded-full border shadow-sm" />
        <div>
          <p className="text-sm font-bold text-slate-800">{s.userId.fullName}</p>
          <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${getRoleColor(s.userId.role)}`}>{s.userId.role}</span>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Lịch Làm Việc (Tổng Quát)</h1>
          <p className="text-slate-500 text-sm mt-1">Xem nhân sự làm việc trong ngày</p>
        </div>
      </div>

      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center gap-2 overflow-x-auto no-scrollbar">
        {daysSelector.map(d => (
          <button
            key={d.iso}
            onClick={() => setSelectedDate(d.iso)}
            className={`flex-shrink-0 px-4 py-2 rounded-lg font-medium text-sm transition-all ${selectedDate === d.iso ? 'bg-indigo-600 text-white shadow-md' : 'bg-slate-100 text-slate-600 hover:bg-indigo-50 hover:text-indigo-600'}`}
          >
            {d.label}
          </button>
        ))}
        <div className="ml-auto flex items-center gap-2">
          <input 
            type="date" 
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="border px-3 py-2 rounded-lg text-sm text-slate-700"
          />
        </div>
      </div>

      {loading ? (
        <div className="text-center py-10">Đang tải...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-md">
            <div className="flex items-center gap-3 mb-6 pb-4 border-b">
              <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center">
                <CalendarIcon size={20} />
              </div>
              <div>
                <h2 className="text-xl font-bold text-slate-800">Ca Sáng</h2>
                <p className="text-xs text-slate-500">8:00 - 12:00 • {morningSchedules.length} nhân viên</p>
              </div>
            </div>

            {morningSchedules.length === 0 ? (
              <div className="text-center py-8 text-slate-400 flex flex-col items-center">
                <Users size={32} className="mb-2 opacity-50" />
                <p>Không có nhân viên đăng ký</p>
              </div>
            ) : (
              <div className="space-y-3">
                {morningSchedules.map(s => <StaffCard key={s._id} s={s} />)}
              </div>
            )}
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-md">
            <div className="flex items-center gap-3 mb-6 pb-4 border-b">
              <div className="w-10 h-10 rounded-xl bg-orange-100 text-orange-600 flex items-center justify-center">
                <CalendarIcon size={20} />
              </div>
              <div>
                <h2 className="text-xl font-bold text-slate-800">Ca Chiều</h2>
                <p className="text-xs text-slate-500">13:00 - 17:00 • {afternoonSchedules.length} nhân viên</p>
              </div>
            </div>

            {afternoonSchedules.length === 0 ? (
              <div className="text-center py-8 text-slate-400 flex flex-col items-center">
                <Users size={32} className="mb-2 opacity-50" />
                <p>Không có nhân viên đăng ký</p>
              </div>
            ) : (
              <div className="space-y-3">
                {afternoonSchedules.map(s => <StaffCard key={s._id} s={s} />)}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
