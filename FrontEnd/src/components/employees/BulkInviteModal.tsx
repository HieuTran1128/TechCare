import React, { useRef, useState } from 'react';
import { X, FileSpreadsheet } from 'lucide-react';
import { motion } from 'framer-motion';
import * as XLSX from 'xlsx';
import { userService } from '../../services';
import type { UserRole } from '../../types';

interface BulkInviteModalProps {
  onClose: () => void;
  onInvited: () => void;
}

type BulkRow = { fullName: string; email: string; phone: string; role: UserRole };

const ROLE_MAP: Record<string, UserRole> = {
  'lễ tân': 'frontdesk', 'le tan': 'frontdesk', 'frontdesk': 'frontdesk',
  'kỹ thuật': 'technician', 'ky thuat': 'technician', 'technician': 'technician', 'kỹ thuật viên': 'technician',
  'kho': 'storekeeper', 'thủ kho': 'storekeeper', 'storekeeper': 'storekeeper',
};

const ROLE_OPTIONS: { value: UserRole; label: string }[] = [
  { value: 'frontdesk', label: 'Lễ tân' },
  { value: 'technician', label: 'Kỹ thuật' },
  { value: 'storekeeper', label: 'Kho' },
];

const EMPTY_ROW: BulkRow = { fullName: '', email: '', phone: '', role: 'technician' };

export const BulkInviteModal: React.FC<BulkInviteModalProps> = ({ onClose, onInvited }) => {
  const [rows, setRows] = useState<BulkRow[]>([{ ...EMPTY_ROW }]);
  const [errors, setErrors] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const excelRef = useRef<HTMLInputElement>(null);

  const updateRow = (index: number, field: keyof BulkRow, value: string) => {
    setRows((prev) => prev.map((r, i) => i === index ? { ...r, [field]: value } : r));
  };

  const addRow = () => setRows((prev) => [...prev, { ...EMPTY_ROW }]);

  const removeRow = (index: number) => setRows((prev) => prev.filter((_, i) => i !== index));

  const handleImportExcel = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      const workbook = XLSX.read(evt.target?.result, { type: 'binary' });
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const rawRows: any[] = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' });
      const dataRows = rawRows.slice(1).filter((r: any[]) => r.some((c) => String(c).trim() !== ''));
      if (dataRows.length === 0) { setErrors(['File Excel không có dữ liệu hoặc sai định dạng']); return; }
      const imported: BulkRow[] = dataRows.map((r: any[]) => ({
        fullName: String(r[0] ?? '').trim(),
        email: String(r[1] ?? '').trim(),
        phone: String(r[2] ?? '').trim(),
        role: ROLE_MAP[String(r[3] ?? '').trim().toLowerCase()] ?? 'technician',
      }));
      const isEmpty = rows.length === 1 && !rows[0].fullName && !rows[0].email;
      setRows(isEmpty ? imported : [...rows, ...imported]);
      setErrors([]);
    };
    reader.readAsBinaryString(file);
    e.target.value = '';
  };

  const handleSubmit = async () => {
    setLoading(true);
    setErrors([]);
    const staffList = rows
      .map((r) => ({ ...r, phone: r.phone || undefined }))
      .filter((r) => r.fullName || r.email);

    if (staffList.length === 0) { setErrors(['Danh sách không được để trống']); setLoading(false); return; }
    const invalidIdx = staffList.findIndex((r) => !r.fullName || !r.email);
    if (invalidIdx !== -1) { setErrors([`Dòng ${invalidIdx + 1} thiếu thông tin bắt buộc`]); setLoading(false); return; }

    try {
      const res = await userService.inviteBulk(staffList);
      const skipped = (res.results || []).filter((r: any) => r.status !== 'CREATED');
      if (skipped.length > 0) {
        setErrors(skipped.map((r: any) => `Email ${r.email}: ${r.reason === 'EMAIL_EXISTS' ? 'đã tồn tại' : 'chức vụ không hợp lệ'}`));
      }
      onInvited();
      onClose();
    } catch (err: any) {
      setErrors([err.response?.data?.message || err.message || 'Có lỗi xảy ra']);
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
        className="bg-white rounded-3xl w-full max-w-3xl p-8 shadow-2xl relative max-h-[90vh] overflow-y-auto"
      >
        <button onClick={onClose} className="absolute top-6 right-6 p-2 text-slate-400 hover:text-slate-600">
          <X size={20} />
        </button>
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-slate-900">Mời nhân viên hàng loạt</h2>
          <p className="text-slate-500 text-sm mt-1">Thêm nhiều dòng nhân viên. Mỗi dòng sẽ gửi mật khẩu qua email.</p>
        </div>

        <input ref={excelRef} type="file" accept=".xlsx,.xls" className="hidden" onChange={handleImportExcel} />

        {errors.length > 0 && (
          <div className="mb-4 space-y-1">
            {errors.map((e, i) => (
              <div key={i} className="p-2 bg-red-50 text-red-700 rounded-xl text-xs">{e}</div>
            ))}
          </div>
        )}

        <div className="space-y-3">
          {rows.map((row, index) => (
            <div key={index} className="grid grid-cols-12 gap-2 items-end bg-slate-50 border border-slate-200 rounded-2xl p-3">
              <div className="col-span-3">
                <label className="text-xs font-bold text-slate-600">Họ tên</label>
                <input type="text" value={row.fullName} onChange={(e) => updateRow(index, 'fullName', e.target.value)}
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-white p-2.5 text-xs" />
              </div>
              <div className="col-span-3">
                <label className="text-xs font-bold text-slate-600">Email</label>
                <input type="email" value={row.email} onChange={(e) => updateRow(index, 'email', e.target.value)}
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-white p-2.5 text-xs" />
              </div>
              <div className="col-span-2">
                <label className="text-xs font-bold text-slate-600">SĐT</label>
                <input type="tel" value={row.phone} onChange={(e) => updateRow(index, 'phone', e.target.value)}
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-white p-2.5 text-xs" />
              </div>
              <div className="col-span-3">
                <label className="text-xs font-bold text-slate-600">Chức vụ</label>
                <div className="mt-1 grid grid-cols-3 gap-1">
                  {ROLE_OPTIONS.map((r) => (
                    <button key={r.value} type="button" onClick={() => updateRow(index, 'role', r.value)}
                      className={`py-2 rounded-lg text-[10px] font-bold border transition-all ${
                        row.role === r.value ? 'bg-emerald-600 border-emerald-600 text-white' : 'bg-white border-slate-200 text-slate-600'
                      }`}>
                      {r.label}
                    </button>
                  ))}
                </div>
              </div>
              <div className="col-span-1 flex gap-1 justify-end">
                <button type="button" onClick={addRow}
                  className="h-9 w-9 rounded-xl border border-emerald-200 text-emerald-600 hover:bg-emerald-50 text-sm font-bold">+</button>
                {rows.length > 1 && (
                  <button type="button" onClick={() => removeRow(index)}
                    className="h-9 w-9 rounded-xl border border-red-200 text-red-500 hover:bg-red-50 text-sm font-bold">-</button>
                )}
              </div>
            </div>
          ))}
        </div>

        <div className="flex gap-3 mt-6">
          <button type="button" onClick={() => excelRef.current?.click()}
            className="w-1/3 bg-white border border-emerald-200 text-emerald-600 font-bold py-3 rounded-xl flex items-center justify-center gap-2">
            <FileSpreadsheet size={16} /> Import Excel
          </button>
          <button type="button" onClick={handleSubmit} disabled={loading}
            className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 rounded-xl shadow-lg shadow-emerald-500/30 disabled:opacity-60">
            {loading ? 'Đang tạo tài khoản...' : 'Tạo tài khoản & Gửi mật khẩu'}
          </button>
        </div>
      </motion.div>
    </div>
  );
};
