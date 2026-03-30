import React, { useState } from 'react';
import { useComplaints } from '../hooks';
import { complaintService } from '../services';
import { ComplaintStatsCards, ComplaintTable, ComplaintDetailModal } from '../components/complaints';
import type { Complaint } from '../types';

const PAGE_SIZE = 15;

export const ComplaintManagement: React.FC = () => {
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('');
  const [selected, setSelected] = useState<Complaint | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const { complaints, stats, total, reload } = useComplaints({
    status: statusFilter || undefined,
    page,
    limit: PAGE_SIZE,
  });

  // Fetch chi tiết đầy đủ khi mở modal (có ticket, repairParts, statusHistory...)
  const handleSelect = async (c: Complaint) => {
    setSelected(c);
    setDetailLoading(true);
    try {
      const detail = await complaintService.getById(c._id);
      setSelected(detail);
    } catch {
      // Giữ data cũ nếu fetch lỗi
    } finally {
      setDetailLoading(false);
    }
  };

  const handleFilterChange = (status: string) => {
    setStatusFilter(status);
    setPage(1);
  };

  return (
    <div className="space-y-5">
      <ComplaintStatsCards stats={stats} />

      <ComplaintTable
        complaints={complaints}
        total={total}
        page={page}
        pageSize={PAGE_SIZE}
        statusFilter={statusFilter}
        onPageChange={setPage}
        onFilterChange={handleFilterChange}
        onSelect={handleSelect}
      />

      {selected && (
        <ComplaintDetailModal
          complaint={selected}
          loading={detailLoading}
          onClose={() => setSelected(null)}
          onResolved={() => { setSelected(null); reload(); }}
        />
      )}
    </div>
  );
};
