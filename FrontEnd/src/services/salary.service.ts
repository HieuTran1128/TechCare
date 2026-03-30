import axios from 'axios';
import { API_BASE, API_CONFIG } from './api.config';

export interface EmployeeSalary {
  userId: string;
  fullName: string;
  role: string;
  totalShifts: number;
  totalHours: number;
  hourlyRate: number;
  totalEarnings: number;
}

export const salaryService = {
  getAll: async () => {
    const res = await axios.get<{ data: EmployeeSalary[] }>(`${API_BASE}/salary`, API_CONFIG);
    return res.data.data;
  },

  updateRate: async (userId: string, hourlyRate: number) => {
    await axios.put(`${API_BASE}/salary/${userId}`, { hourlyRate }, API_CONFIG);
  },
};
