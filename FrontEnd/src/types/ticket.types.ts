// Shared types cho ticket domain - dùng chung ở mọi nơi thay vì duplicate

export type TicketStatus =
  | 'RECEIVED'
  | 'MANAGER_ASSIGNED'
  | 'DIAGNOSING'
  | 'WAITING_INVENTORY'
  | 'INVENTORY_APPROVED'
  | 'INVENTORY_REJECTED'
  | 'QUOTED'
  | 'CUSTOMER_APPROVED'
  | 'CUSTOMER_REJECTED'
  | 'IN_PROGRESS'
  | 'COMPLETED'
  | 'PAYMENTED'
  | 'REJECTED'
  | 'CANCELLED'
  | 'DONE_INVENTORY_REJECTED'
  | 'WARRANTY_DONE'
  | 'WARRANTY_IN_PROGRESS'
  | 'WARRANTY_COMPLETED'
  | 'WARRANTY_CANCELLED'
  | 'WARRANTY_REJECTED'
  | 'WARRANTY_PAID'
  | 'WARRANTY_PENDING'
  | 'WARRANTY_WAITING_CUSTOMER_APPROVAL'
  | 'WARRANTY_DONE_INVENTORY_REJECTED'
  | 'WARRANTY_DONE_INVENTORY_APPROVED';

export interface Customer {
  _id: string;
  fullName: string;
  phone: string;
  email?: string;
  address?: string;
}

export interface Device {
  _id?: string;
  deviceType?: string;
  brand: string;
  model: string;
  customer?: Customer;
}

export interface Technician {
  _id: string;
  fullName: string;
  role: string;
  email?: string;
  avatar?: string;
}

// ticket.types.ts có Part riêng (cho RepairPart), inventory.types.ts có Part đầy đủ hơn
// Để tránh conflict, đổi tên Part trong ticket.types thành RepairPartInfo
export interface RepairPartInfo {
  _id: string;
  partName: string;
  brand?: string;
  price: number;
  warrantyMonths?: number;
}

export interface RepairPart {
  part?: RepairPartInfo;
  quantity: number;
  unitPrice?: number;
}

export interface Quote {
  diagnosisResult?: string;
  workDescription?: string;
  laborCost?: number;
  estimatedCost?: number;
  estimatedCompletionDate?: string;
}

export interface TicketInventoryRequest {
  status?: 'PENDING' | 'APPROVED' | 'REJECTED' | 'NOT_REQUIRED';
  noteFromTechnician?: string;
  noteFromStorekeeper?: string;
  requiredParts?: RepairPart[];
  requestedBy?: Technician;
}

export interface Payment {
  method?: 'CASH' | 'PAYOS';
  status?: 'PENDING' | 'PAID';
  paidAt?: string;
  payosCheckoutUrl?: string;
}

export interface StatusHistoryItem {
  status: string;
  changedBy?: Technician;
  changedAt: string;
  note?: string;
}

export interface Ticket {
  _id: string;
  ticketCode: string;
  status: TicketStatus;
  initialIssue: string;
  finalCost?: number;
  createdAt: string;
  updatedAt?: string;
  completedAt?: string;
  isWarrantyClaim?: boolean;
  warrantyClaimType?: 'STORE_FAULT' | 'CUSTOMER_FAULT';
  device?: Device;
  technician?: Technician;
  createdBy?: Technician;
  managerAssignedBy?: Technician;
  quote?: Quote;
  inventoryRequest?: TicketInventoryRequest;
  repairParts?: RepairPart[];
  payment?: Payment;
  statusHistory?: StatusHistoryItem[];
}
