import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Calendar as CalendarIcon, Clock, CheckCircle } from 'lucide-react';

interface WorkSchedule {
  _id: string;
  date: string;
  shift: 'morning' | 'afternoon';
}

const API_BASE = 'http://localhost:3000/api';

export const PersonalSchedule: React.FC = () => {
  const [schedules, setSchedules] = useState<WorkSchedule[]>([]);
  const [loading, setLoading] = useState(false);
  
  // Create a 7 day list from today
  const today = new Date();
  const next7Days = Array.from({ length: 7 }).map((_, i) => {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    return d.toISOString().split('T')[0];
  });

  useEffect(() => {
    fetchSchedules();
  }, []);

  const fetchSchedules = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${API_BASE}/schedules/my`, {
        withCredentials: true,
        params: {
          startDate: next7Days[0],
          endDate: next7Days[next7Days.length - 1],
        }
      });
      setSchedules(res.data.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const hasShift = (date: string, shift: 'morning' | 'afternoon') => {
    return schedules.some((s) => s.date === date && s.shift === shift);
  };

  const toggleShift = async (date: string, shift: 'morning' | 'afternoon') => {
    const isRegistered = hasShift(date, shift);
    try {
      if (isRegistered) {
        await axios.delete(`${API_BASE}/schedules/cancel`, {
          withCredentials: true,
          params: { date, shift }
        });
      } else {
        await axios.post(`${API_BASE}/schedules/register`, {
          date,
          shift
        }, { withCredentials: true });
      }
      fetchSchedules();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Lỗi khi cập nhật ca làm việc');
    }
  };

  const getDayName = (dateStr: string) => {
    const date = new Date(dateStr);
    const day = date.toLocaleDateString('vi-VN', { weekday: 'long' });
    const formattedDate = date.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' });
    return { day, formattedDate };
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">Lịch Làm Việc</h1>
        <p className="text-slate-500 text-sm mt-1">Đăng ký ca làm việc của bạn trong 7 ngày tới</p>
      </div>

      <div className="bg-white/60 dark:bg-slate-800/40 backdrop-blur-xl p-6 rounded-2xl border border-white/20 dark:border-slate-700 shadow-lg">
        {loading && <div className="text-center py-10">Đang tải lịch...</div>}
        
        {!loading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {next7Days.map(date => {
              const { day, formattedDate } = getDayName(date);
              const morn = hasShift(date, 'morning');
              const aft = hasShift(date, 'afternoon');
              
              return (
                <div key={date} className="bg-white dark:bg-slate-900 rounded-xl p-4 border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col">
                  <div className="flex justify-between items-center mb-4 border-b pb-2">
                    <span className="font-bold text-slate-800 dark:text-slate-100 capitalize">{day}</span>
                    <span className="text-sm text-slate-500 flex items-center gap-1 font-medium bg-slate-100 px-2 py-0.5 rounded-full"><CalendarIcon size={12}/> {formattedDate}</span>
                  </div>
                  
                  <div className="flex flex-col gap-3">
                    <button 
                      onClick={() => toggleShift(date, 'morning')}
                      className={`flex items-center justify-between p-3 rounded-lg border-2 transition-all group ${morn ? 'border-blue-500 bg-blue-50 text-blue-800' : 'border-slate-100 bg-slate-50 text-slate-600 hover:border-blue-200 hover:bg-white'}`}
                    >
                      <div className="flex items-center gap-2">
                        <Clock size={16} className={morn ? 'text-blue-600' : 'text-slate-400'} />
                        <span className="font-semibold text-sm">Ca Sáng</span>
                      </div>
                      <span className="text-xs">{morn ? <CheckCircle size={16} className="text-blue-600" /> : '8:00 - 12:00'}</span>
                    </button>

                    <button 
                      onClick={() => toggleShift(date, 'afternoon')}
                      className={`flex items-center justify-between p-3 rounded-lg border-2 transition-all group ${aft ? 'border-orange-500 bg-orange-50 text-orange-800' : 'border-slate-100 bg-slate-50 text-slate-600 hover:border-orange-200 hover:bg-white'}`}
                    >
                      <div className="flex items-center gap-2">
                        <Clock size={16} className={aft ? 'text-orange-600' : 'text-slate-400'} />
                        <span className="font-semibold text-sm">Ca Chiều</span>
                      </div>
                      <span className="text-xs">{aft ? <CheckCircle size={16} className="text-orange-600" /> : '13:00 - 17:00'}</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
