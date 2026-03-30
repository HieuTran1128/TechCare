import React from 'react';
import { Pagination } from '../ui';
import { COMPLAINT_CATEGORY_LABELS, COMPLAINT_STATUS_CONFIG } from '../../constants';
import type { Complaint } from '../../types';

interface ComplaintTableProps {
  complaints: Complaint[];
  total: number;
  page: number;
  pageSize: number;
  statusFilter: string;
  onPageChange: (page: number) => void;
  onFilterChange: (status: string) => void;
  onSelect: (complaint: Complaint) => void;
}

const FILTER_OPTIONS = [
  { v: '', l: 'Tất cả' },
  { v: 'OPEN', l: 'Mới' },
  { v: 'IN_PROGRESS', l: 'Đang xử lý' },
  { v: 'CLOSED', l: 'Đã đóng' },
];

export const ComplaintTable: React.FC<ComplaintTableProps> = ({
  complaints,
  total,
  page,
  pageSize,
  statusFilter,
  onPageChange,
  onFilterChange,
  onSelect,
}) => {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <div className="space-y-3">
      {/* Filter buttons */}
      <div className="flex flex-wrap gap-2">
        {FILTER_OPTIONS.map((f) => (
          <button
            key={f.v}
            onClick={() => { onFilterChange(f.v); onPageChange(1); }}
            className={`px-4 py-1.5 rounded-lg text-sm ${statusFilter === f.v ? 'bg-blue-600 text-white' : 'bg-white border'}`}
          >
            {f.l}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white border rounded-2xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-slate-500 text-xs">
              <tr>
                <th className="px-4 py-3 text-left">Mã phiếu</th>
                <th className="px-4 py-3 text-left">Khách hàng</th>
                <th className="px-4 py-3 text-left">KTV sửa chữa</th>
                <th className="px-4 py-3 text-left">Loại khiếu nại</th>
                <th className="px-4 py-3 text-left">Nội dung</th>
                <th className="px-4 py-3 text-left">Trạng thái</th>
                <th className="px-4 py-3 text-left">Ngày gửi</th>
                <th className="px-4 py-3 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {complaints.map((c) => {
                const st = COMPLAINT_STATUS_CONFIG[c.status as keyof typeof COMPLAINT_STATUS_CONFIG]
                  || { label: c.status, className: 'bg-slate-100 text-slate-600' };
                const categories = Array.isArray(c.category) ? c.category : [c.category];

                return (
                  <tr key={c._id} className="border-t border-slate-100 hover:bg-slate-50/50">
                    <td className="px-4 py-3 font-mono text-xs font-semibold text-blue-700">
                      {c.complaintCode}
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-medium text-slate-800">{c.customer?.fullName || 'N/A'}</p>
                      <p className="text-xs text-slate-400">{c.customer?.phone || ''}</p>
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-600">
                      {(c.ticket as any)?.technician?.fullName || <span className="text-slate-300">—</span>}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1">
                        {categories.map((cat) => (
                          <span key={cat} className="px-1.5 py-0.5 bg-rose-50 text-rose-600 rounded text-xs">
                            {COMPLAINT_CATEGORY_LABELS[cat as keyof typeof COMPLAINT_CATEGORY_LABELS] || cat}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-4 py-3 max-w-xs">
                      <p className="text-slate-700 line-clamp-2 text-xs">{c.description}</p>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${st.className}`}>
                        {st.label}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-500">
                      {new Date(c.createdAt).toLocaleDateString('vi-VN')}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => onSelect(c)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold ${
                          c.status === 'CLOSED'
                            ? 'bg-slate-100 text-slate-500'
                            : 'bg-violet-600 text-white'
                        }`}
                      >
                        {c.status === 'CLOSED' ? 'Xem' : 'Xử lý'}
                      </button>
                    </td>
                  </tr>
                );
              })}
              {complaints.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-slate-400 text-sm">
                    Không có khiếu nại nào.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="px-4 py-3 border-t border-slate-100">
          <Pagination
            currentPage={page}
            totalPages={totalPages}
            onPageChange={onPageChange}
          />
        </div>
      </div>
    </div>
  );
};
