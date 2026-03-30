// Service layer cho complaint domain

import axios from 'axios';
import { API_BASE, API_CONFIG } from './api.config';
import type { Complaint, ComplaintStats } from '../types';

export const complaintService = {
  /**
   * Lấy danh sách khiếu nại với phân trang
   */
  getAll: async (params?: { status?: string; page?: number; limit?: number }) => {
    const response = await axios.get<{ complaints: Complaint[]; total: number }>(
      `${API_BASE}/complaints`,
      { ...API_CONFIG, params }
    );
    return response.data;
  },

  /**
   * Lấy chi tiết 1 khiếu nại
   */
  getById: async (id: string) => {
    const response = await axios.get<Complaint>(`${API_BASE}/complaints/${id}`, API_CONFIG);
    return response.data;
  },

  /**
   * Lấy thống kê khiếu nại
   */
  getStats: async () => {
    const response = await axios.get<ComplaintStats>(
      `${API_BASE}/complaints/stats`,
      API_CONFIG
    );
    return response.data;
  },

  /**
   * Xử lý khiếu nại (gửi phản hồi cho khách)
   */
  resolve: async (
    id: string,
    data: {
      resolution: string;
      compensationType: string;
      compensationAmount: number;
    }
  ) => {
    const response = await axios.patch(
      `${API_BASE}/complaints/${id}/resolve`,
      data,
      API_CONFIG
    );
    return response.data;
  },
};
