// Service layer cho inventory domain

import axios from 'axios';
import { API_BASE, API_CONFIG } from './api.config';
import type { Part, Supplier, ImportRecord, UsageRecord, StockAlert, InventoryStats, InventoryKPI } from '../types';

export const inventoryService = {
  // Parts
  getAllParts: async (search?: string) => {
    const response = await axios.get<Part[]>(`${API_BASE}/parts`, {
      ...API_CONFIG,
      params: { search },
    });
    return response.data;
  },

  createPart: async (data: { partName: string; brand: string; imageUrl: string }) => {
    const response = await axios.post<Part>(`${API_BASE}/parts`, data, API_CONFIG);
    return response.data;
  },

  updatePart: async (id: string, data: Partial<Part>) => {
    const response = await axios.patch<Part>(`${API_BASE}/parts/${id}`, data, API_CONFIG);
    return response.data;
  },

  deletePart: async (id: string) => {
    await axios.delete(`${API_BASE}/parts/${id}`, API_CONFIG);
  },

  importStock: async (id: string, data: { quantity: number; importPrice: number; supplierId: string; note?: string }) => {
    await axios.post(`${API_BASE}/parts/${id}/import`, data, API_CONFIG);
  },

  bulkImport: async (data: { supplierId: string; note: string; items: Array<{ partId: string; quantity: number; importPrice: number }> }) => {
    await axios.post(`${API_BASE}/parts/import`, data, API_CONFIG);
  },

  createAlert: async (id: string, message: string) => {
    await axios.post(`${API_BASE}/parts/${id}/alert`, { message }, API_CONFIG);
  },

  // History
  getImportHistory: async () => {
    const response = await axios.get<ImportRecord[]>(`${API_BASE}/parts/import-history`, API_CONFIG);
    return response.data;
  },

  getUsageHistory: async () => {
    const response = await axios.get<UsageRecord[]>(`${API_BASE}/parts/usage-history`, API_CONFIG);
    return response.data;
  },

  getAlerts: async () => {
    const response = await axios.get<StockAlert[]>(`${API_BASE}/parts/alerts`, API_CONFIG);
    return response.data;
  },

  // Stats & KPI
  getStats: async () => {
    const response = await axios.get<InventoryStats>(`${API_BASE}/parts/stats/summary`, API_CONFIG);
    return response.data;
  },

  getKPI: async (fromDate?: string, toDate?: string) => {
    const params: Record<string, string> = {};
    if (fromDate) params.fromDate = fromDate;
    if (toDate) params.toDate = toDate + 'T23:59:59';
    const response = await axios.get<InventoryKPI>(`${API_BASE}/parts/kpi`, {
      ...API_CONFIG,
      params,
    });
    return response.data;
  },

  // Suppliers
  getAllSuppliers: async () => {
    const response = await axios.get<Supplier[]>(`${API_BASE}/suppliers`, API_CONFIG);
    return response.data;
  },

  createSupplier: async (data: Omit<Supplier, '_id'>) => {
    const response = await axios.post<Supplier>(`${API_BASE}/suppliers`, data, API_CONFIG);
    return response.data;
  },

  updateSupplier: async (id: string, data: Partial<Supplier>) => {
    const response = await axios.patch<Supplier>(`${API_BASE}/suppliers/${id}`, data, API_CONFIG);
    return response.data;
  },

  deleteSupplier: async (id: string) => {
    await axios.delete(`${API_BASE}/suppliers/${id}`, API_CONFIG);
  },
};
