// Custom hook cho inventory domain

import { useState, useEffect, useCallback } from 'react';
import { inventoryService } from '../services';
import type { Part, InventoryStats } from '../types';

interface UseInventoryOptions {
  search?: string;
  autoLoad?: boolean;
}

export const useInventory = (options: UseInventoryOptions = {}) => {
  const { search = '', autoLoad = true } = options;

  const [parts, setParts] = useState<Part[]>([]);
  const [stats, setStats] = useState<InventoryStats>({
    totalParts: 0,
    totalQuantity: 0,
    lowStock: 0,
    outOfStock: 0,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const [partsData, statsData] = await Promise.all([
        inventoryService.getAllParts(search),
        inventoryService.getStats(),
      ]);
      setParts(partsData || []);
      setStats(statsData);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Không thể tải dữ liệu kho');
      setParts([]);
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => {
    if (autoLoad) {
      load();
    }
  }, [load, autoLoad]);

  return {
    parts,
    stats,
    loading,
    error,
    reload: load,
  };
};
