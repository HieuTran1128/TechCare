import React from 'react';
import { StatusBadge } from '../ui';
import type { Ticket } from '../../types';

interface TicketCardProps {
  ticket: Ticket;
  onClick?: () => void;
  showTimeline?: boolean;
}

const TIMELINE_STATUSES = ['RECEIVED', 'DIAGNOSING', 'WAITING_INVENTORY', 'INVENTORY_APPROVED', 'QUOTED', 'IN_PROGRESS', 'COMPLETED'];

export const TicketCard: React.FC<TicketCardProps> = ({
  ticket,
  onClick,
  showTimeline = false,
}) => {
  const renderTimeline = () => {
    const currentIdx = TIMELINE_STATUSES.indexOf(ticket.status);
    return (
      <div className="flex gap-1 mt-2">
        {TIMELINE_STATUSES.map((_, idx) => (
          <div
            key={idx}
            className={`h-1.5 flex-1 rounded-full ${
              currentIdx >= idx ? 'bg-indigo-500' : 'bg-slate-200'
            }`}
          />
        ))}
      </div>
    );
  };

  return (
    <div
      onClick={onClick}
      className={`border rounded-xl p-3 ${onClick ? 'cursor-pointer hover:bg-slate-50' : ''}`}
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <p className="font-semibold text-slate-900">{ticket.ticketCode}</p>
        <div className="flex flex-col items-end gap-1">
          <StatusBadge status={ticket.status} />
          {ticket.isWarrantyClaim && (
            <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-violet-100 text-violet-700">
              BẢO HÀNH
            </span>
          )}
        </div>
      </div>

      {showTimeline && renderTimeline()}

      <div className="mt-2 space-y-1 text-sm">
        <p className="font-medium text-slate-700">{ticket.device?.customer?.fullName}</p>
        <p className="text-xs text-slate-500">
          {ticket.device?.deviceType || '-'} • {ticket.device?.brand || '-'} • {ticket.device?.model || '-'}
        </p>
        <p className="text-xs text-slate-500 line-clamp-2">{ticket.initialIssue}</p>
      </div>

      {ticket.technician && (
        <p className="mt-2 text-xs text-slate-400">
          KTV: {ticket.technician.fullName}
        </p>
      )}
    </div>
  );
};
