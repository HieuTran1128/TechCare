import axios from 'axios';
import { API_BASE, API_CONFIG } from './api.config';

export const profileService = {
  update: async (data: { fullName: string; phone: string }) => {
    await axios.patch(`${API_BASE}/users/profile`, data, API_CONFIG);
  },

  changePassword: async (data: { currentPassword: string; newPassword: string }) => {
    await axios.patch(`${API_BASE}/users/password`, data, API_CONFIG);
  },
};
