// Service layer cho ticket domain - tách axios ra khỏi components

import axios from 'axios';
import { API_BASE, API_CONFIG } from './api.config';
import type { Ticket } from '../types';

export const ticketService = {
  /**
   * Lấy tổng hợp thống kê cho manager dashboard
   */
  getSummary: async () => {
    const response = await axios.get<{ totalTickets: number; completedTickets: number; rejectedTickets: number; totalRevenue: number }>(
      `${API_BASE}/ticket/manager/summary`,
      API_CONFIG
    );
    return response.data;
  },

  /**
   * Lấy danh sách tickets với filter
   */
  getAll: async (params?: {
    limit?: number;
    sort?: string;
    technicianId?: string;
    includeAll?: boolean;
  }) => {
    const response = await axios.get<{ data: Ticket[]; total?: number }>(
      `${API_BASE}/ticket`,
      { ...API_CONFIG, params }
    );
    return response.data;
  },

  /**
   * Lấy chi tiết 1 ticket
   */
  getById: async (id: string) => {
    const response = await axios.get<Ticket>(`${API_BASE}/ticket/${id}`, API_CONFIG);
    return response.data;
  },

  /**
   * Tìm ticket theo code (cho frontdesk)
   */
  findByCode: async (ticketCode: string) => {
    const response = await axios.get<Ticket>(
      `${API_BASE}/ticket/frontdesk/find-by-code`,
      { ...API_CONFIG, params: { ticketCode } }
    );
    return response.data;
  },

  /**
   * Search tickets theo keyword (autocomplete)
   */
  searchByCode: async (keyword: string, limit = 8) => {
    const response = await axios.get<{ data: Ticket[] }>(
      `${API_BASE}/ticket/frontdesk/search-by-code`,
      { ...API_CONFIG, params: { keyword, limit } }
    );
    return response.data;
  },

  /**
   * Tạo ticket mới
   */
  create: async (data: { deviceId: string; initialIssue: string }) => {
    const response = await axios.post<Ticket>(`${API_BASE}/ticket`, data, API_CONFIG);
    return response.data;
  },

  /**
   * Phân công kỹ thuật viên
   */
  assign: async (ticketId: string, technicianId: string) => {
    const response = await axios.patch(
      `${API_BASE}/ticket/${ticketId}/assign`,
      { technicianId },
      API_CONFIG
    );
    return response.data;
  },

  /**
   * Gửi yêu cầu kho
   */
  submitInventoryRequest: async (
    ticketId: string,
    data: {
      needsReplacement: boolean;
      noteFromTechnician?: string;
      requiredParts?: Array<{ part: string; quantity: number; unitPrice: number }>;
    }
  ) => {
    const response = await axios.patch(
      `${API_BASE}/ticket/${ticketId}/inventory-request`,
      data,
      API_CONFIG
    );
    return response.data;
  },

  /**
   * Kho duyệt/từ chối yêu cầu
   */
  respondInventoryRequest: async (
    ticketId: string,
    data: { available: boolean; noteFromStorekeeper: string }
  ) => {
    const response = await axios.patch(
      `${API_BASE}/ticket/${ticketId}/inventory-response`,
      data,
      API_CONFIG
    );
    return response.data;
  },

  /**
   * Gửi báo giá cho khách
   */
  submitQuote: async (
    ticketId: string,
    data: {
      diagnosisResult: string;
      laborCost: number;
      estimatedCost: number;
      workDescription: string;
      estimatedCompletionDate?: string;
      partsWarranty?: Array<{ partId: string; warrantyMonths: number }>;
    }
  ) => {
    const response = await axios.patch(
      `${API_BASE}/ticket/${ticketId}/quotation`,
      data,
      API_CONFIG
    );
    return response.data;
  },

  /**
   * Gửi email từ chối kho
   */
  sendInventoryRejectionEmail: async (ticketId: string, message: string) => {
    const response = await axios.patch(
      `${API_BASE}/ticket/${ticketId}/inventory-reject-mail`,
      { message },
      API_CONFIG
    );
    return response.data;
  },

  /**
   * Bắt đầu sửa
   */
  startRepair: async (ticketId: string) => {
    const response = await axios.patch(
      `${API_BASE}/ticket/${ticketId}/start`,
      {},
      API_CONFIG
    );
    return response.data;
  },

  /**
   * Hoàn thành sửa chữa
   */
  complete: async (
    ticketId: string,
    data: { pickupNote: string; usedParts: any[]; finalCost: number }
  ) => {
    const response = await axios.patch(
      `${API_BASE}/ticket/${ticketId}/complete`,
      data,
      API_CONFIG
    );
    return response.data;
  },

  /**
   * Thanh toán tiền mặt
   */
  markCashPaid: async (ticketId: string) => {
    const response = await axios.patch(
      `${API_BASE}/ticket/${ticketId}/payment/mark-paid`,
      { paymentMethod: 'CASH' },
      API_CONFIG
    );
    return response.data;
  },

  /**
   * Tạo link thanh toán PayOS
   */
  createPayOSPayment: async (ticketId: string) => {
    const response = await axios.post<{ checkoutUrl: string }>(
      `${API_BASE}/ticket/${ticketId}/payment/payos`,
      {},
      API_CONFIG
    );
    return response.data;
  },

  /**
   * Xác nhận đã thanh toán PayOS
   */
  markPayOSPaid: async (ticketId: string) => {
    const response = await axios.patch(
      `${API_BASE}/ticket/${ticketId}/payment/mark-paid`,
      { paymentMethod: 'PAYOS' },
      API_CONFIG
    );
    return response.data;
  },
};
