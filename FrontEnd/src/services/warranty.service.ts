import axios from 'axios';
import { API_BASE, API_CONFIG } from './api.config';

export const warrantyService = {
  getAll: async (status?: string) => {
    const params: any = {};
    if (status && status !== 'all') params.status = status;
    const res = await axios.get(`${API_BASE}/warranties`, { ...API_CONFIG, params });
    return res.data;
  },

  claim: async (id: string, data: { claimType: string; claimNote: string }) => {
    const res = await axios.patch(`${API_BASE}/warranties/${id}/claim`, data, API_CONFIG);
    return res.data;
  },

  completeTicket: async (ticketId: string, pickupNote = '') => {
    await axios.patch(`${API_BASE}/warranties/ticket/${ticketId}/complete`, { pickupNote }, API_CONFIG);
  },

  startTicket: async (ticketId: string) => {
    await axios.patch(`${API_BASE}/warranties/ticket/${ticketId}/start`, {}, API_CONFIG);
  },
};
