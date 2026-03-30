import React from 'react';
import { Trash2, Clock, X, Ban, ShieldCheck } from 'lucide-react';
import type { User, UserRole, UserStatus } from '../../types';

interface EmployeeTableProps {
  employees: User[];
  loading: boolean;
  error: string | null;
  onDelete: (id: string, name: string) => void;
  onToggleBlock: (id: string, blocked: boolean, name: string) => void;
}

const ROLE_BADGE: Record<UserRole, { label: string; className: string }> = {
  manager:     { label: 'Quản trị', className: 'bg-blue-100 text-blue-700 border-blue-200' },
  technician:  { label: 'Kỹ thuật', className: 'bg-orange-100 text-orange-700 border-orange-200' },
  storekeeper: { label: 'Kho hàng', className: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
  frontdesk:   { label: 'Lễ tân',   className: 'bg-purple-100 text-purple-700 border-purple-200' },
};

const StatusDisplay: React.FC<{ status: UserStatus }> = ({ status }) => {
  switch (status) {
    case 'ACTIVE':
      return (
        <span className="text-emerald-600 text-xs font-bold flex items-center gap-1.5">
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> Hoạt động
        </span>
      );
    case 'INVITED':
      return (
        <span className="text-amber-600 text-xs font-bold flex items-center gap-1.5">
          <Clock size={12} /> Chờ kích hoạt
        </span>
      );
    case 'BLOCKED':
      return (
        <span className="text-red-600 text-xs font-bold flex items-center gap-1.5">
          <Ban size={12} /> Đã chặn
        </span>
      );
    case 'REJECTED':
      return (
        <span className="text-red-600 text-xs font-bold flex items-center gap-1.5">
          <X size={12} /> Đã từ chối
        </span>
      );
    default:
      return <span className="text-xs">{status}</span>;
  }
};

export const EmployeeTable: React.FC<EmployeeTableProps> = ({
  employees,
  loading,
  error,
  onDelete,
  onToggleBlock,
}) => {
  if (loading) return <div className="p-8 text-center text-slate-400">Đang tải...</div>;
  if (error) return <div className="p-6 text-red-600 text-center">{error}</div>;

  return (
    <div className="bg-white/60 backdrop-blur-xl rounded-2xl border border-white/20 shadow-lg overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead className="bg-slate-50/50">
            <tr>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Nhân viên</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Vai trò</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Trạng thái</th>
              <th className="px-6 py-4 text-right">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {employees.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-6 py-10 text-center text-slate-500">Chưa có nhân viên nào</td>
              </tr>
            ) : (
              employees.map((emp) => {
                const roleBadge = ROLE_BADGE[emp.role as UserRole];
                return (
                  <tr key={emp._id || emp.id} className="hover:bg-blue-50/30 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <img
                          src={emp.avatar || `https://i.pravatar.cc/150?u=${emp.email}`}
                          alt={emp.fullName}
                          className="w-10 h-10 rounded-full border-2 border-white shadow-sm"
                        />
                        <div>
                          <span className="block font-bold text-slate-900">{emp.fullName}</span>
                          <span className="text-xs text-slate-500">{emp.email}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {roleBadge && (
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase border ${roleBadge.className}`}>
                          {roleBadge.label}
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <StatusDisplay status={emp.status as UserStatus} />
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {emp.role !== 'manager' && (
                          <button
                            onClick={() => onToggleBlock(emp._id || emp.id, emp.status !== 'BLOCKED', emp.fullName)}
                            className={`p-2 rounded-lg transition-all ${
                              emp.status === 'BLOCKED'
                                ? 'text-emerald-600 hover:bg-emerald-50'
                                : 'text-amber-600 hover:bg-amber-50'
                            }`}
                            title={emp.status === 'BLOCKED' ? 'Mở chặn' : 'Chặn'}
                          >
                            {emp.status === 'BLOCKED' ? <ShieldCheck size={18} /> : <Ban size={18} />}
                          </button>
                        )}
                        <button
                          onClick={() => onDelete(emp._id || emp.id, emp.fullName)}
                          className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                          title="Xóa nhân viên"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
