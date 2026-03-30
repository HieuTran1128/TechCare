import axios from 'axios';
import { API_BASE, API_CONFIG } from './api.config';

export const authService = {
  login: async (email: string, password: string) => {
    const res = await axios.post(`${API_BASE}/auth/login`, { email, password }, API_CONFIG);
    return res.data;
  },

  logout: async () => {
    await axios.post(`${API_BASE}/auth/logout`, {}, API_CONFIG).catch(() => undefined);
  },

  forgotPassword: async (email: string) => {
    await axios.post(`${API_BASE}/auth/forgot-password`, { email }, API_CONFIG);
  },

  verifyOtp: async (email: string, otp: string) => {
    const res = await axios.post(`${API_BASE}/auth/verify-otp`, { email, otp }, API_CONFIG);
    return res.data;
  },

  resetPassword: async (email: string, otp: string, newPassword: string) => {
    await axios.post(`${API_BASE}/auth/reset-password`, { email, otp, newPassword }, API_CONFIG);
  },

  activate: async (token: string, password: string) => {
    const res = await axios.post(`${API_BASE}/auth/activate`, { token, password }, API_CONFIG);
    return res.data;
  },

  getComplaintForm: async (token: string) => {
    const res = await axios.get(`${API_BASE}/complaints/form/${token}`, API_CONFIG);
    return res.data;
  },

  submitComplaint: async (token: string, data: { category: string[]; description: string }) => {
    const res = await axios.post(`${API_BASE}/complaints/submit/${token}`, data, API_CONFIG);
    return res.data;
  },

  getProfile: async () => {
    const res = await axios.get(`${API_BASE}/users/me`, API_CONFIG);
    return res.data;
  },

  updateAvatar: async (file: File) => {
    const formData = new FormData();
    formData.append('avatar', file);
    const res = await axios.post(`${API_BASE}/users/avatar`, formData, {
      ...API_CONFIG,
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data.avatar as string;
  },
};
