// Custom hook cho ticket domain - tách state + fetch logic ra khỏi component

import { useState, useEffect, useCallback } from 'react';
import { ticketService } from '../services';
import type { Ticket } from '../types';

interface UseTicketsOptions {
  limit?: number;
  sort?: string;
  technicianId?: string;
  includeAll?: boolean;
  autoLoad?: boolean; // Tự động load khi mount, default true
}

/**
 * useTickets: Hook quản lý danh sách tickets.
 * Tách logic fetch + state ra khỏi component để tái sử dụng.
 *
 * @example
 * const { tickets, loading, reload } = useTickets({ limit: 100 });
 */
export const useTickets = (options: UseTicketsOptions = {}) => {
  const { autoLoad = true, ...params } = options;

  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await ticketService.getAll(params);
      setTickets(data.data || []);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Không thể tải danh sách phiếu');
      setTickets([]);
    } finally {
      setLoading(false);
    }
  }, [JSON.stringify(params)]);

  useEffect(() => {
    if (autoLoad) {
      load();
    }
  }, [load, autoLoad]);

  return {
    tickets,
    loading,
    error,
    reload: load,
  };
};
