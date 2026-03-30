// Custom hook cho complaint domain

import { useState, useEffect, useCallback } from 'react';
import { complaintService } from '../services';
import type { Complaint, ComplaintStats } from '../types';

interface UseComplaintsOptions {
  status?: string;
  page?: number;
  limit?: number;
}

/**
 * useComplaints: Hook quản lý danh sách khiếu nại + stats.
 *
 * @example
 * const { complaints, stats, loading, reload } = useComplaints({ status: 'OPEN', page: 1, limit: 15 });
 */
export const useComplaints = (options: UseComplaintsOptions = {}) => {
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [stats, setStats] = useState<ComplaintStats>({
    open: 0,
    inProgress: 0,
    closed: 0,
    total: 0,
  });
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Gọi song song 2 API
      const [listData, statsData] = await Promise.all([
        complaintService.getAll(options),
        complaintService.getStats(),
      ]);

      setComplaints(listData.complaints || []);
      setTotal(listData.total || 0);
      setStats(statsData);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Không thể tải danh sách khiếu nại');
      setComplaints([]);
    } finally {
      setLoading(false);
    }
  }, [JSON.stringify(options)]);

  useEffect(() => {
    load();
  }, [load]);

  return {
    complaints,
    stats,
    total,
    loading,
    error,
    reload: load,
  };
};
