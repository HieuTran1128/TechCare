import React, { useMemo, useState } from 'react';
import { UserPlus, Search } from 'lucide-react';
import { AnimatePresence } from 'framer-motion';
import { useEmployees } from '../hooks';
import { userService } from '../services';
import { EmployeeTable, InviteModal, BulkInviteModal } from '../components/employees';

export const EmployeeManagement: React.FC = () => {
  const { employees, loading, error, reload } = useEmployees();
  const [searchTerm, setSearchTerm] = useState('');
  const [showInvite, setShowInvite] = useState(false);
  const [showBulk, setShowBulk] = useState(false);

  const filtered = useMemo(
    () => employees.filter(
      (e) =>
        e.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        e.email.toLowerCase().includes(searchTerm.toLowerCase())
    ),
    [employees, searchTerm]
  );

  const handleDelete = async (id: string, name: string) => {
    if (!window.confirm(`Bạn có chắc muốn xóa nhân viên ${name}? Hành động này không thể hoàn tác.`)) return;
    try {
      await userService.delete(id);
      reload();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Không thể xóa nhân viên');
    }
  };

  const handleToggleBlock = async (id: string, blocked: boolean, name: string) => {
    if (!window.confirm(`Xác nhận ${blocked ? 'chặn' : 'mở chặn'} nhân viên ${name}?`)) return;
    try {
      await userService.toggleBlock(id, blocked);
      reload();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Không thể cập nhật trạng thái');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div />
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setShowInvite(true)}
            className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-5 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 shadow-lg shadow-blue-500/30"
          >
            <UserPlus size={18} /> Mời nhân viên
          </button>
          <button
            onClick={() => setShowBulk(true)}
            className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white px-5 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 shadow-lg shadow-emerald-500/30"
          >
            <UserPlus size={18} /> Mời hàng loạt
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="bg-white/60 backdrop-blur-xl p-4 rounded-2xl border border-white/20 shadow-lg">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
          <input
            type="text"
            placeholder="Tìm theo tên hoặc email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/50 outline-none"
          />
        </div>
      </div>

      {/* Table */}
      <EmployeeTable
        employees={filtered}
        loading={loading}
        error={error}
        onDelete={handleDelete}
        onToggleBlock={handleToggleBlock}
      />

      {/* Modals */}
      <AnimatePresence>
        {showInvite && (
          <InviteModal
            onClose={() => setShowInvite(false)}
            onInvited={reload}
          />
        )}
        {showBulk && (
          <BulkInviteModal
            onClose={() => setShowBulk(false)}
            onInvited={reload}
          />
        )}
      </AnimatePresence>
    </div>
  );
};
