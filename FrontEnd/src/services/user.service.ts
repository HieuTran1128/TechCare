import axios from 'axios';
import { API_BASE, API_CONFIG } from './api.config';
import type { User } from '../types';

export const userService = {
  getAll: async () => {
    const res = await axios.get<{ data: User[] } | User[]>(`${API_BASE}/users`, API_CONFIG);
    return (res.data as any).data || res.data;
  },

  invite: async (data: { fullName: string; email: string; phone?: string; role: string }) => {
    const res = await axios.post(`${API_BASE}/users/invite`, data, API_CONFIG);
    return res.data;
  },

  inviteBulk: async (staffList: Array<{ fullName: string; email: string; phone?: string; role: string }>) => {
    const res = await axios.post(`${API_BASE}/users/invite-bulk`, { staffList }, API_CONFIG);
    return res.data;
  },

  delete: async (id: string) => {
    const res = await axios.delete(`${API_BASE}/users/${id}`, API_CONFIG);
    return res.data;
  },

  toggleBlock: async (id: string, blocked: boolean) => {
    const res = await axios.patch(`${API_BASE}/users/${id}/block`, { blocked }, API_CONFIG);
    return res.data;
  },
};
