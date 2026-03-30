// Custom hook cho customer domain

import { useState, useEffect, useCallback } from 'react';
import { customerService } from '../services';
import type { Customer } from '../types';

/**
 * useCustomers: Hook quản lý danh sách khách hàng.
 *
 * @example
 * const { customers, loading, reload } = useCustomers();
 */
export const useCustomers = () => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await customerService.getAll();
      setCustomers(data || []);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Không thể tải danh sách khách hàng');
      setCustomers([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return {
    customers,
    loading,
    error,
    reload: load,
  };
};
