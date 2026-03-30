// Shared types cho complaint domain

import type { Ticket, Customer } from './ticket.types';

export type ComplaintCategory =
  | 'SERVICE_QUALITY'
  | 'PRICE'
  | 'TECHNICIAN'
  | 'TURNAROUND_TIME'
  | 'OTHER';

export type ComplaintStatus = 'OPEN' | 'IN_PROGRESS' | 'CLOSED' | 'REJECTED';

export type CompensationType = 'NONE' | 'REFUND' | 'DISCOUNT' | 'REDO';

export interface Complaint {
  _id: string;
  complaintCode: string;
  category: ComplaintCategory | ComplaintCategory[];
  description: string;
  status: ComplaintStatus;
  resolution?: string;
  compensationType?: CompensationType;
  compensationAmount?: number;
  createdAt: string;
  resolvedAt?: string;
  ticket?: Ticket;
  customer?: Customer;
  assignedTo?: {
    fullName: string;
  };
}

export interface ComplaintStats {
  open: number;
  inProgress: number;
  closed: number;
  total: number;
}
