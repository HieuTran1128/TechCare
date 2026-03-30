// Service layer cho customer domain

import axios from 'axios';
import { API_BASE, API_CONFIG } from './api.config';
import type { Customer } from '../types';

export const customerService = {
  /**
   * Lấy danh sách khách hàng
   */
  getAll: async () => {
    const response = await axios.get<Customer[]>(`${API_BASE}/customers`, API_CONFIG);
    return response.data;
  },

  /**
   * Tạo khách hàng mới
   */
  create: async (data: { fullName: string; phone: string; email: string }) => {
    const response = await axios.post<Customer>(`${API_BASE}/customers`, data, API_CONFIG);
    return response.data;
  },

  /**
   * Cập nhật thông tin khách hàng
   */
  update: async (
    customerId: string,
    data: { fullName: string; phone: string; email: string }
  ) => {
    const response = await axios.patch<Customer>(
      `${API_BASE}/customers/${customerId}`,
      data,
      API_CONFIG
    );
    return response.data;
  },
};
