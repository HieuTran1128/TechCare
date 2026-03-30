import {
  LayoutDashboard, Wrench, Package, Settings, Users, ClipboardList,
  UserPlus, MessageCircle, ChartColumn, CalendarDays, Banknote,
  ShieldCheck, MessageSquareWarning,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type {
  TicketStatus, ComplaintCategory, ComplaintStatus, CompensationType,
} from './types';

// ─── Menu ────────────────────────────────────────────────────────────────────
export type Role = 'manager' | 'technician' | 'storekeeper' | 'frontdesk';

export interface MenuItem {
  label: string;
  path: string;
  icon: LucideIcon;
  roles: Role[];
}

export const MENU_ITEMS: MenuItem[] = [
  { label: 'Tổng quan', path: '/admin', icon: LayoutDashboard, roles: ['manager'] },
  { label: 'Lịch làm việc', path: '/schedules', icon: CalendarDays, roles: ['manager'] },
  { label: 'Lịch của tôi', path: '/my-schedule', icon: CalendarDays, roles: ['technician', 'storekeeper', 'frontdesk'] },
  { label: 'Tiếp nhận', path: '/frontdesk', icon: ClipboardList, roles: ['frontdesk'] },
  { label: 'Điều phối sửa chữa', path: '/technician', icon: Wrench, roles: ['frontdesk', 'technician'] },
  { label: 'Kho linh kiện', path: '/inventory', icon: Package, roles: ['manager', 'storekeeper'] },
  { label: 'Nhân viên', path: '/employees', icon: UserPlus, roles: ['manager'] },
  { label: 'Doanh Thu', path: '/kpi', icon: ChartColumn, roles: ['manager'] },
  { label: 'Bảng Lương', path: '/payroll', icon: Banknote, roles: ['manager'] },
  { label: 'Khách hàng', path: '/customer-lookup', icon: Users, roles: ['manager', 'frontdesk'] },
  { label: 'Bảo hành', path: '/warranty', icon: ShieldCheck, roles: ['manager', 'frontdesk'] },
  { label: 'Khiếu nại', path: '/complaints', icon: MessageSquareWarning, roles: ['manager'] },
  { label: 'Chat nội bộ', path: '/chat', icon: MessageCircle, roles: ['manager', 'technician', 'storekeeper', 'frontdesk'] },
  { label: 'Cài đặt', path: '/settings', icon: Settings, roles: ['manager', 'technician', 'storekeeper', 'frontdesk'] },
];

// ─── Ticket Status ────────────────────────────────────────────────────────────
export const TICKET_STATUS_LABELS: Record<TicketStatus, string> = {
  RECEIVED: 'Tiếp nhận',
  MANAGER_ASSIGNED: 'Quản lý phân công',
  DIAGNOSING: 'Kỹ thuật kiểm tra',
  WAITING_INVENTORY: 'Chờ kho duyệt',
  INVENTORY_APPROVED: 'Kho đã duyệt',
  INVENTORY_REJECTED: 'Kho từ chối',
  QUOTED: 'Đã gửi báo giá',
  CUSTOMER_APPROVED: 'Khách đồng ý',
  CUSTOMER_REJECTED: 'Khách từ chối',
  IN_PROGRESS: 'Đang sửa',
  COMPLETED: 'Hoàn thành',
  PAYMENTED: 'Đã thanh toán',
  REJECTED: 'Từ chối',
  CANCELLED: 'Đã hủy',
  DONE_INVENTORY_REJECTED: 'Kho từ chối',
  WARRANTY_DONE: 'Bảo hành xong',
  WARRANTY_IN_PROGRESS: 'Đang bảo hành',
  WARRANTY_COMPLETED: 'Bảo hành hoàn thành',
  WARRANTY_CANCELLED: 'Bảo hành hủy',
  WARRANTY_REJECTED: 'Bảo hành từ chối',
  WARRANTY_PAID: 'Bảo hành đã thanh toán',
  WARRANTY_PENDING: 'Bảo hành đang chờ',
  WARRANTY_WAITING_CUSTOMER_APPROVAL: 'Bảo hành đang chờ khách hàng xác nhận',
  WARRANTY_DONE_INVENTORY_REJECTED: 'Bảo hành kho từ chối',
  WARRANTY_DONE_INVENTORY_APPROVED: 'Bảo hành kho đã duyệt',
};

export const TICKET_STATUS_COLORS: Record<TicketStatus, string> = {
  RECEIVED: 'bg-blue-100 text-blue-700',
  MANAGER_ASSIGNED: 'bg-indigo-100 text-indigo-700',
  DIAGNOSING: 'bg-violet-100 text-violet-700',
  WAITING_INVENTORY: 'bg-amber-100 text-amber-700',
  INVENTORY_APPROVED: 'bg-emerald-100 text-emerald-700',
  INVENTORY_REJECTED: 'bg-rose-100 text-rose-700',
  QUOTED: 'bg-cyan-100 text-cyan-700',
  CUSTOMER_APPROVED: 'bg-teal-100 text-teal-700',
  CUSTOMER_REJECTED: 'bg-red-100 text-red-700',
  IN_PROGRESS: 'bg-purple-100 text-purple-700',
  COMPLETED: 'bg-green-100 text-green-700',
  PAYMENTED: 'bg-emerald-200 text-emerald-800',
  REJECTED: 'bg-red-100 text-red-700',
  CANCELLED: 'bg-slate-200 text-slate-700',
  DONE_INVENTORY_REJECTED: 'bg-red-100 text-red-700',
  WARRANTY_DONE: 'bg-violet-200 text-violet-800',
  WARRANTY_IN_PROGRESS: 'bg-orange-100 text-orange-800',
  WARRANTY_COMPLETED: 'bg-emerald-100 text-emerald-800',
  WARRANTY_CANCELLED: 'bg-red-100 text-red-800',
  WARRANTY_REJECTED: 'bg-red-100 text-red-800',
  WARRANTY_PAID: 'bg-emerald-100 text-emerald-800',
  WARRANTY_PENDING: 'bg-yellow-100 text-yellow-800',
  WARRANTY_WAITING_CUSTOMER_APPROVAL: 'bg-indigo-100 text-indigo-800',
  WARRANTY_DONE_INVENTORY_REJECTED: 'bg-red-100 text-red-800',
  WARRANTY_DONE_INVENTORY_APPROVED: 'bg-emerald-100 text-emerald-800',
};

export const TICKET_STATUS_TIMELINE: TicketStatus[] = [
  'RECEIVED', 'DIAGNOSING', 'WAITING_INVENTORY',
  'INVENTORY_APPROVED', 'QUOTED', 'IN_PROGRESS', 'COMPLETED',
];

// ─── Complaint ────────────────────────────────────────────────────────────────
export const COMPLAINT_CATEGORY_LABELS: Record<ComplaintCategory, string> = {
  SERVICE_QUALITY: 'Chất lượng dịch vụ',
  PRICE: 'Giá cả',
  TECHNICIAN: 'Thái độ KTV',
  TURNAROUND_TIME: 'Thời gian xử lý',
  OTHER: 'Khác',
};

export const COMPLAINT_STATUS_CONFIG: Record<ComplaintStatus, { label: string; className: string }> = {
  OPEN: { label: 'Mới', className: 'bg-rose-100 text-rose-700' },
  IN_PROGRESS: { label: 'Đang xử lý', className: 'bg-amber-100 text-amber-700' },
  CLOSED: { label: 'Đã đóng', className: 'bg-emerald-100 text-emerald-700' },
  REJECTED: { label: 'Từ chối', className: 'bg-slate-100 text-slate-600' },
};

export const COMPENSATION_OPTIONS: { value: CompensationType; label: string }[] = [
  { value: 'NONE', label: 'Không bồi thường' },
  { value: 'REFUND', label: 'Hoàn tiền' },
  { value: 'DISCOUNT', label: 'Giảm giá lần sau' },
  { value: 'REDO', label: 'Sửa lại miễn phí' },
];
