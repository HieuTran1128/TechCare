import { useState, useEffect, useCallback } from 'react';
import { userService } from '../services';
import type { User } from '../types';

export const useEmployees = () => {
  const [employees, setEmployees] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await userService.getAll();
      setEmployees(data || []);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Không thể tải danh sách nhân viên');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  return { employees, loading, error, reload: load };
};
