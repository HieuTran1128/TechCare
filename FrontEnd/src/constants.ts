import { LayoutDashboard, Wrench, Package, Settings, HelpCircle, Users, ClipboardList, UserPlus, MessageCircle, ChartColumn, CalendarDays, Banknote } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

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
  { label: 'Chat nội bộ', path: '/chat', icon: MessageCircle, roles: ['manager', 'technician', 'storekeeper', 'frontdesk'] },
  { label: 'Cài đặt', path: '/settings', icon: Settings, roles: ['manager', 'technician', 'storekeeper', 'frontdesk'] },
];