import React, { useState } from 'react';
import { X } from 'lucide-react';
import { motion } from 'framer-motion';
import { userService } from '../../services';
import type { UserRole } from '../../types';

interface InviteModalProps {
  onClose: () => void;
  onInvited: () => void;
}

const ROLE_OPTIONS: { value: UserRole; label: string }[] = [
  { value: 'frontdesk', label: 'Lễ tân' },
  { value: 'technician', label: 'Kỹ thuật' },
  { value: 'storekeeper', label: 'Kho' },
];

export const InviteModal: React.FC<InviteModalProps> = ({ onClose, onInvited }) => {
  const [form, setForm] = useState({ fullName: '', email: '', phone: '', role: 'technician' as UserRole });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await userService.invite({
        fullName: form.fullName,
        email: form.email,
        phone: form.phone || undefined,
        role: form.role,
      });
      onInvited();
      onClose();
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Có lỗi xảy ra khi gửi lời mời';
      setError(msg === 'EMAIL_EXISTS' ? 'Email này đã tồn tại trong hệ thống' : msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        className="bg-white rounded-3xl w-full max-w-md p-8 shadow-2xl relative"
      >
        <button onClick={onClose} className="absolute top-6 right-6 p-2 text-slate-400 hover:text-slate-600">
          <X size={20} />
        </button>

        <div className="mb-8">
          <h2 className="text-2xl font-bold text-slate-900">Mời nhân viên mới</h2>
          <p className="text-slate-500 text-sm mt-1">Nhân viên sẽ nhận email chứa link để kích hoạt tài khoản.</p>
        </div>

        {error && <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-xl text-sm">{error}</div>}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-1.5">
            <label className="text-sm font-bold text-slate-700">Họ tên</label>
            <input
              required
              type="text"
              value={form.fullName}
              onChange={(e) => setForm({ ...form, fullName: e.target.value })}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 p-3.5 text-sm"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-bold text-slate-700">Email</label>
            <input
              required
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 p-3.5 text-sm"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-bold text-slate-700">Số điện thoại (tùy chọn)</label>
            <input
              type="tel"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 p-3.5 text-sm"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-bold text-slate-700">Chức vụ</label>
            <div className="grid grid-cols-3 gap-2">
              {ROLE_OPTIONS.map((r) => (
                <button
                  key={r.value}
                  type="button"
                  onClick={() => setForm({ ...form, role: r.value })}
                  className={`py-2.5 rounded-xl text-xs font-bold border transition-all ${
                    form.role === r.value
                      ? 'bg-blue-600 border-blue-600 text-white'
                      : 'bg-white border-slate-200 text-slate-600'
                  }`}
                >
                  {r.label}
                </button>
              ))}
            </div>
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-xl mt-4 shadow-xl shadow-blue-500/30 transition-all disabled:opacity-60"
          >
            {loading ? 'Đang gửi lời mời...' : 'Gửi lời mời & Chờ kích hoạt'}
          </button>
        </form>
      </motion.div>
    </div>
  );
};
