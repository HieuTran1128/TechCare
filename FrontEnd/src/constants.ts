
import {  LayoutDashboard, Wrench, Package, Search, Settings, HelpCircle, Users, UserPlus, ClipboardList } from 'lucide-react';


export type Role = 'manager' | 'technician' | 'warehouse' | 'frontdesk' | 'customer';
export type UserStatus = 'active' | 'pending';

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  avatar: string;
  status: UserStatus;
}

export interface Ticket {
  id: string;
  device: string;
  issue: string;
  status: 'pending' | 'in-progress' | 'completed';
  customerName: string;
  customerPhone?: string;
  deadline: string;
  priority: 'low' | 'medium' | 'high';
  createdAt?: string;
}

export interface InventoryItem {
  id: string;
  name: string;
  sku: string;
  quantity: number;
  price: number;
  image: string;
  category: string;
}

export interface TrackingStep {
  title: string;
  date: string;
  status: 'completed' | 'current' | 'upcoming';
}

export interface TrackingInfo {
  id: string;
  customerName: string;
  device: string;
  issue: string;
  technician: string;
  estimatedCompletion: string;
  steps: TrackingStep[];
}


export const MOCK_USERS: User[] = [
  {
    id: 'u1',
    name: 'Nguyễn Admin',
    email: 'admin@techcare.vn',
    role: 'manager',
    avatar: 'https://i.pravatar.cc/150?u=manager',
    status: 'active',
  },
  {
    id: 'u2',
    name: 'Trần Kỹ Thuật',
    email: 'tech@techcare.vn',
    role: 'technician',
    avatar: 'https://i.pravatar.cc/150?u=tech',
    status: 'active',
  },
  {
    id: 'u3',
    name: 'Lê Kho',
    email: 'kho@techcare.vn',
    role: 'warehouse',
    avatar: 'https://i.pravatar.cc/150?u=warehouse',
    status: 'active',
  },
  {
    id: 'u4',
    name: 'Phạm Lễ Tân',
    email: 'letan@techcare.vn',
    role: 'frontdesk',
    avatar: 'https://i.pravatar.cc/150?u=frontdesk',
    status: 'active',
  },
];

export const MOCK_TICKETS: Ticket[] = [
  { id: '#TC-8821', device: 'iPad Air 4', issue: 'Mất nguồn', status: 'pending', customerName: 'Nguyễn Văn A', deadline: '10:30 AM', priority: 'high' },
  { id: '#TC-8830', device: 'Dell XPS 13', issue: 'Vệ sinh máy', status: 'pending', customerName: 'Khách vãng lai', deadline: 'Ngay lập tức', priority: 'low' },
  { id: '#TC-8819', device: 'iPhone 13 Pro Max', issue: 'Vỡ màn hình - Test FaceID', status: 'in-progress', customerName: 'Trần Thị B', deadline: '30p', priority: 'high' },
  { id: '#TC-8790', device: 'MacBook Pro M1', issue: 'Lỗi phím', status: 'in-progress', customerName: 'Lê Hùng', deadline: '2h', priority: 'medium' },
  { id: '#TC-8755', device: 'Xiaomi Redmi Note 10', issue: 'Ép kính', status: 'completed', customerName: 'Phạm Minh', deadline: '1h trước', priority: 'low' },
];

export const MOCK_INVENTORY: InventoryItem[] = [
  { id: '1', name: 'Màn hình iPhone 13 Pro Max', sku: 'SCR-IP13PM-ORG', quantity: 12, price: 4500000, category: 'Màn hình', image: 'https://picsum.photos/200/200?random=1' },
  { id: '2', name: 'Pin Samsung S21 Ultra', sku: 'BAT-SS21U-GEN', quantity: 3, price: 800000, category: 'Pin', image: 'https://picsum.photos/200/200?random=2' },
  { id: '3', name: 'Chip Apple M1 Silicon', sku: 'CPU-AP-M1', quantity: 45, price: 2200000, category: 'Chip', image: 'https://picsum.photos/200/200?random=3' },
];

export const MOCK_TRACKING: TrackingInfo = {
  id: 'TC-83921',
  customerName: 'Nguyễn Văn A',
  device: 'iPad Air 4',
  issue: 'Mất nguồn, không nhận sạc',
  technician: 'Trần Kỹ Thuật',
  estimatedCompletion: '16:30 - Hôm nay',
  steps: [
    { title: 'Tiếp nhận', date: '08:30 12/10', status: 'completed' },
    { title: 'Kiểm tra', date: '09:15 12/10', status: 'completed' },
    { title: 'Đang sửa', date: '10:00 12/10', status: 'current' },
    { title: 'Hoàn thành', date: '--:--', status: 'upcoming' },
  ]
};

// --- Menu Config ---

export interface MenuItem {
  label: string;
  path: string;
  icon: LucideIcon;
  roles: Role[];
}

export const MENU_ITEMS: MenuItem[] = [
  { label: 'Tổng quan', path: '/admin', icon: LayoutDashboard, roles: ['manager'] },
  { label: 'Tiếp nhận máy', path: '/frontdesk', icon: ClipboardList, roles: ['manager', 'frontdesk'] },
  { label: 'Nhân viên', path: '/employees', icon: UserPlus, roles: ['manager'] },
  { label: 'Kỹ thuật viên', path: '/technician', icon: Wrench, roles: ['manager', 'technician'] },
  { label: 'Kho linh kiện', path: '/inventory', icon: Package, roles: ['manager', 'warehouse', 'technician'] },
  { label: 'Khách hàng', path: '/customer-lookup', icon: Users, roles: ['manager'] },
  { label: 'Tra cứu', path: '/customer-lookup', icon: Search, roles: ['customer'] },
  { label: 'Cài đặt', path: '/settings', icon: Settings, roles: ['manager', 'technician', 'warehouse', 'frontdesk'] },
  { label: 'Trợ giúp', path: '/help', icon: HelpCircle, roles: ['manager', 'technician', 'warehouse', 'customer', 'frontdesk'] },
];