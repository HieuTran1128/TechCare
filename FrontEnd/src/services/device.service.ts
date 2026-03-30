// Service layer cho device domain

import axios from 'axios';
import { API_BASE, API_CONFIG } from './api.config';
import type { Device } from '../types';

export const deviceService = {
  /**
   * Tạo device mới
   */
  create: async (data: {
    customerId: string;
    deviceType: string;
    brand: string;
    model: string;
  }) => {
    const response = await axios.post<Device>(`${API_BASE}/devices`, data, API_CONFIG);
    return response.data;
  },
};
