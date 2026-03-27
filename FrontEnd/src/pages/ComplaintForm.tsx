import React, { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import axios from 'axios';
import { AlertTriangle, CheckCircle2 } from 'lucide-react';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api';

const CATEGORIES = [
  { value: 'QUALITY', label: 'Chất lượng sửa chữa' },
  { value: 'PRICE', label: 'Giá cả' },
  { value: 'ATTITUDE', label: 'Thái độ nhân viên' },
  { value: 'SERVICE', label: 'Dịch vụ' },
  { value: 'OTHER', label: 'Khác' },
];

export const ComplaintForm: React.FC = () => {
  const [params] = useSearchParams();
  const ticketCode = params.get('ticket') || '';
  const prefillName = params.get('name') || '';
  const prefillEmail = params.get('email') || '';

  const [form, setForm] = useState({
    customerName: prefillName,
    customerEmail: prefillEmail,
    category: 'QUALITY',
    content: '',
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.content.trim()) { setError('Vui lòng nhập nội dung khiếu nại.'); return; }
    try {
      setLoading(true); setError('');
      await axios.post(`${API_BASE}/complaints`, { ...form, ticketCode });
      setSuccess(true);
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Không thể gửi khiếu nại. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
        <div className="bg-white rounded-2xl shadow-lg border p-8 max-w-md w-full text-center space-y-4">
          <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto">
            <CheckCircle2 size={36} className="text-emerald-600" />
          </div>
          <h2 className="text-xl font-bold text-slate-900">Gửi khiếu nại thành công</h2>
          <p className="text-slate-500 text-sm">Chúng tôi đã nhận được khiếu nại của bạn và sẽ phản hồi qua email trong thời gian sớm nhất.</p>
          <p className="text-xs text-slate-400">Mã phiếu: <strong>{ticketCode}</strong></p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
      <div className="bg-white rounded-2xl shadow-lg border w-full max-w-lg overflow-hidden">
        <div className="bg-gradient-to-r from-red-600 to-orange-500 p-5 text-white">
          <div className="flex items-center gap-3">
            <AlertTriangle size={24} />
            <div>
              <h1 className="text-lg font-bold">Gửi khiếu nại dịch vụ</h1>
              <p className="text-sm opacity-90">Mã phiếu: <strong>{ticketCode}</strong></p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-slate-600 block mb-1">Họ tên *</label>
              <input
                required
                value={form.customerName}
                onChange={(e) => setForm({ ...form, customerName: e.target.value })}
                className="w-full border rounded-xl px-3 py-2.5 text-sm"
                placeholder="Nguyễn Văn A"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-600 block mb-1">Email *</label>
              <input
                required
                type="email"
                value={form.customerEmail}
                onChange={(e) => setForm({ ...form, customerEmail: e.target.value })}
                className="w-full border rounded-xl px-3 py-2.5 text-sm"
                placeholder="email@example.com"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-600 block mb-1">Loại khiếu nại *</label>
            <select
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
              className="w-full border rounded-xl px-3 py-2.5 text-sm"
            >
              {CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
            </select>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-600 block mb-1">Nội dung khiếu nại *</label>
            <textarea
              required
              rows={5}
              value={form.content}
              onChange={(e) => setForm({ ...form, content: e.target.value })}
              className="w-full border rounded-xl px-3 py-2.5 text-sm resize-none"
              placeholder="Mô tả chi tiết vấn đề bạn gặp phải..."
            />
          </div>

          {error && <p className="text-sm text-rose-600 bg-rose-50 border border-rose-200 rounded-xl px-3 py-2">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-red-600 hover:bg-red-700 text-white font-semibold py-3 rounded-xl transition disabled:opacity-50"
          >
            {loading ? 'Đang gửi...' : 'Gửi khiếu nại'}
          </button>
          <p className="text-xs text-slate-400 text-center">Chúng tôi sẽ phản hồi qua email của bạn trong vòng 24-48 giờ.</p>
        </form>
      </div>
    </div>
  );
};
