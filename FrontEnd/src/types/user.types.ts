// Shared types cho user domain

export type UserRole = 'manager' | 'technician' | 'storekeeper' | 'frontdesk';

export type UserStatus = 'INVITED' | 'ACTIVE' | 'BLOCKED' | 'REJECTED';

export interface User {
  id: string;
  _id?: string;
  email: string;
  fullName: string;
  role: UserRole;
  status?: UserStatus;
  avatar?: string;
  phone?: string;
  createdAt?: string;
}
