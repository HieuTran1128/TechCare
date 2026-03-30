// Component tái sử dụng cho status badge - thay thế inline render ở mọi nơi

import React from 'react';
import { TICKET_STATUS_LABELS, TICKET_STATUS_COLORS } from '../../constants';
import type { TicketStatus } from '../../types';

interface StatusBadgeProps {
  status: TicketStatus;
  className?: string;
}

/**
 * StatusBadge: Hiển thị trạng thái ticket với màu sắc tương ứng.
 * Dùng chung thay vì copy-paste <span className={...}> ở mọi nơi.
 */
export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, className = '' }) => {
  const label = TICKET_STATUS_LABELS[status] || status;
  const colorClass = TICKET_STATUS_COLORS[status] || 'bg-slate-100 text-slate-700';

  return (
    <span
      className={`inline-flex px-2 py-0.5 rounded-full text-xs font-semibold ${colorClass} ${className}`}
    >
      {label}
    </span>
  );
};
