import axios from 'axios';
import { API_BASE, API_CONFIG } from './api.config';

export interface TechnicianKPI {
  technicianId: string;
  technicianName: string;
  totalOrders: number;
  completedOrders: number;
  rejectedOrders: number;
  totalRevenue: number;
  completionRate: number;
  rejectionRate: number;
  avgLeadTime: number;
}

export interface PeriodSummary {
  period: string;
  totalRevenue: number;
  totalOrders: number;
  completedOrders: number;
  rejectedOrders: number;
  completionRate: number;
  rejectionRate: number;
}

export interface KpiResponse {
  groupBy: 'week' | 'month';
  range: { startDate: string | null; endDate: string | null };
  technicians: TechnicianKPI[];
  periodSummary: PeriodSummary[];
}

export const kpiService = {
  get: async (params: { startDate: string; endDate: string; groupBy: 'week' | 'month' }) => {
    const response = await axios.get<KpiResponse>(`${API_BASE}/kpi`, { ...API_CONFIG, params });
    return response.data;
  },
};
