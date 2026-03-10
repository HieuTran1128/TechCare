import { LayoutDashboard, Wrench, Package, Settings, HelpCircle, Users, ClipboardList, UserPlus } from 'lucide-react';
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
  { label: 'Tiếp nhận', path: '/frontdesk', icon: ClipboardList, roles: ['frontdesk'] },
  { label: 'Điều phối sửa chữa', path: '/technician', icon: Wrench, roles: ['manager', 'technician'] },
  { label: 'Kho linh kiện', path: '/inventory', icon: Package, roles: ['manager', 'storekeeper'] },
  { label: 'Nhân viên', path: '/employees', icon: UserPlus, roles: ['manager'] },
  { label: 'Khách hàng', path: '/customer-lookup', icon: Users, roles: ['manager', 'frontdesk'] },
  { label: 'Cài đặt', path: '/settings', icon: Settings, roles: ['manager', 'technician', 'storekeeper', 'frontdesk'] },
  { label: 'Trợ giúp', path: '/help', icon: HelpCircle, roles: ['manager', 'technician', 'storekeeper', 'frontdesk'] },
];
