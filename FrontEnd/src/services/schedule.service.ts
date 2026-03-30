import axios from 'axios';
import { API_BASE, API_CONFIG } from './api.config';

export interface WorkSchedule {
  _id: string;
  date: string;
  shift: 'morning' | 'afternoon';
  userId?: { _id: string; fullName: string; role: string; avatar?: string };
}

export const scheduleService = {
  getMy: async (startDate: string, endDate: string) => {
    const res = await axios.get<{ data: WorkSchedule[] }>(`${API_BASE}/schedules/my`, { ...API_CONFIG, params: { startDate, endDate } });
    return res.data.data;
  },

  getAll: async (startDate: string, endDate: string) => {
    const res = await axios.get<{ data: WorkSchedule[] }>(`${API_BASE}/schedules`, { ...API_CONFIG, params: { startDate, endDate } });
    return res.data.data;
  },

  register: async (date: string, shift: 'morning' | 'afternoon') => {
    await axios.post(`${API_BASE}/schedules/register`, { date, shift }, API_CONFIG);
  },

  cancel: async (date: string, shift: 'morning' | 'afternoon') => {
    await axios.delete(`${API_BASE}/schedules/cancel`, { ...API_CONFIG, params: { date, shift } });
  },
};
