import React, { useEffect, useState } from 'react';
import axios from 'axios';

interface Ticket {
  _id: string;
  ticketCode: string;
  initialIssue: string;
  status: string;
  createdAt: string;
  device?: { brand: string; model: string; deviceType: string; customer?: { fullName: string } };
}

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api';

export const ReceptionistBoard: React.FC = () => {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const [form, setForm] = useState({
    customerName: '',
    customerPhone: '',
    customerEmail: '',
    deviceType: '',
    brand: '',
    model: '',
    issue: '',
  });

  const loadTickets = async () => {
    try {
      const res = await axios.get(`${API_BASE}/ticket?limit=10&sort=-createdAt`, { withCredentials: true });
      setTickets(res.data.data || []);
    } catch {
      setTickets([]);
    }
  };

  useEffect(() => {
    loadTickets();
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      const customers = await axios.get(`${API_BASE}/customers`, { withCredentials: true });
      const list = customers.data || [];

      const byPhone = list.find((c: any) => c.phone === form.customerPhone.trim());
      const byEmail = list.find((c: any) => c.email?.toLowerCase() === form.customerEmail.trim().toLowerCase());
      const found = byPhone || byEmail;

      let customerId = found?._id;

      if (!customerId) {
        const newCustomer = await axios.post(
          `${API_BASE}/customers`,
          {
            fullName: form.customerName.trim(),
            phone: form.customerPhone.trim(),
            email: form.customerEmail.trim(),
          },
          { withCredentials: true },
        );
        customerId = newCustomer.data._id;
      } else {
        await axios.patch(
          `${API_BASE}/customers/${customerId}`,
          {
            fullName: form.customerName.trim(),
            phone: form.customerPhone.trim(),
            email: form.customerEmail.trim(),
          },
          { withCredentials: true },
        );
      }

      const device = await axios.post(
        `${API_BASE}/devices`,
        {
          customerId,
          deviceType: form.deviceType.trim(),
          brand: form.brand.trim(),
          model: form.model.trim(),
        },
        { withCredentials: true },
      );

      await axios.post(
        `${API_BASE}/ticket`,
        {
          deviceId: device.data._id,
          initialIssue: form.issue.trim(),
        },
        { withCredentials: true },
      );

      setMessage('Tạo phiếu thành công. Quản lý sẽ phân công kỹ thuật viên.');
      setForm({
        customerName: '',
        customerPhone: '',
        customerEmail: '',
        deviceType: '',
        brand: '',
        model: '',
        issue: '',
      });
      loadTickets();
    } catch (err: any) {
      const backendMsg = err.response?.data?.message;
      if (backendMsg === 'EMAIL_ALREADY_EXISTS') {
        setMessage('Email đã tồn tại ở khách hàng khác. Vui lòng nhập đúng email/SĐT của khách cũ hoặc dùng email mới.');
      } else if (backendMsg === 'CUSTOMER_ALREADY_EXISTS') {
        setMessage('Số điện thoại đã tồn tại. Hệ thống sẽ dùng hồ sơ khách hàng cũ.');
      } else {
        setMessage(backendMsg || 'Tạo phiếu thất bại');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <section className="lg:col-span-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5">
        <h2 className="font-bold text-lg mb-4">Tiếp nhận khách hàng</h2>
        <form onSubmit={submit} className="space-y-3">
          {[
            ['customerName', 'Tên khách hàng'],
            ['customerPhone', 'Số điện thoại'],
            ['customerEmail', 'Email'],
            ['deviceType', 'Loại máy'],
            ['brand', 'Hãng'],
            ['model', 'Model'],
          ].map(([k, label]) => (
            <input
              key={k}
              required
              placeholder={label}
              value={(form as any)[k]}
              onChange={(e) => setForm({ ...form, [k]: e.target.value })}
              className="w-full border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 bg-white dark:bg-slate-950"
            />
          ))}

          <textarea
            required
            placeholder="Mô tả lỗi ban đầu"
            value={form.issue}
            onChange={(e) => setForm({ ...form, issue: e.target.value })}
            className="w-full border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 bg-white dark:bg-slate-950 h-24"
          />

          <button disabled={loading} className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700">
            {loading ? 'Đang tạo...' : 'Tạo phiếu'}
          </button>
          {message && <p className="text-sm text-slate-600 dark:text-slate-300">{message}</p>}
        </form>
      </section>

      <section className="lg:col-span-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5">
        <h2 className="font-bold text-lg mb-4">Đơn mới tiếp nhận</h2>
        <div className="space-y-3">
          {tickets.map((t) => (
            <div key={t._id} className="border border-slate-200 dark:border-slate-700 rounded-lg p-3">
              <div className="flex justify-between">
                <p className="font-semibold">{t.ticketCode}</p>
                <p className="text-xs text-slate-500">{t.status}</p>
              </div>
              <p className="text-sm text-slate-600 dark:text-slate-300">
                {t.device?.brand} {t.device?.model} - {t.initialIssue}
              </p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};
