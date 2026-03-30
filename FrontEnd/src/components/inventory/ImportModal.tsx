import React, { useState } from 'react';
import { X } from 'lucide-react';
import type { Part, Supplier } from '../../types';

interface ImportModalProps {
  part: Part;
  suppliers: Supplier[];
  onClose: () => void;
  onImport: (data: { quantity: number; importPrice: number; supplierId: string; note: string }) => Promise<void>;
  latestPrice?: number;
  avgPrice?: number;
}

export const ImportModal: React.FC<ImportModalProps> = ({
  part,
  suppliers,
  onClose,
  onImport,
  latestPrice = 0,
  avgPrice = 0,
}) => {
  const [quantity, setQuantity] = useState('');
  const [importPrice, setImportPrice] = useState(String(latestPrice || ''));
  const [supplierId, setSupplierId] = useState('');
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!supplierId) {
      setError('Vui lòng chọn nhà cung cấp.');
      return;
    }

    const qty = Number(quantity);
    const price = Number(importPrice);

    if (!qty || qty <= 0) {
      setError('Số lượng phải lớn hơn 0.');
      return;
    }

    if (price < 0) {
      setError('Giá nhập không hợp lệ.');
      return;
    }

    try {
      setLoading(true);
      await onImport({ quantity: qty, importPrice: price, supplierId, note });
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Không thể nhập kho.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl w-full max-w-md p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-bold text-lg">Nhập kho</h3>
            <p className="text-sm text-slate-500">{part.partName} {part.brand && `(${part.brand})`}</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X size={20} />
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-lg text-sm">{error}</div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="bg-slate-50 rounded-lg p-3 text-sm space-y-1">
            <p>Tồn hiện tại: <span className="font-semibold">{part.stock}</span></p>
            <p>Giá bán: <span className="font-semibold">{part.price.toLocaleString('vi-VN')} ₫</span></p>
            {latestPrice > 0 && (
              <p>Giá nhập gần nhất: <span className="font-semibold">{latestPrice.toLocaleString('vi-VN')} ₫</span></p>
            )}
            {avgPrice > 0 && (
              <p>Giá nhập TB: <span className="font-semibold">{avgPrice.toLocaleString('vi-VN')} ₫</span></p>
            )}
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-slate-700">Nhà cung cấp *</label>
            <select
              required
              value={supplierId}
              onChange={(e) => setSupplierId(e.target.value)}
              className="w-full border rounded-xl px-3 py-2.5 text-sm"
            >
              <option value="">Chọn nhà cung cấp</option>
              {suppliers.map((s) => (
                <option key={s._id} value={s._id}>{s.name}</option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-slate-700">Số lượng nhập *</label>
            <input
              required
              type="number"
              min="1"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              className="w-full border rounded-xl px-3 py-2.5 text-sm"
              placeholder="Nhập số lượng"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-slate-700">Giá nhập (₫) *</label>
            <input
              required
              type="number"
              min="0"
              value={importPrice}
              onChange={(e) => setImportPrice(e.target.value)}
              className="w-full border rounded-xl px-3 py-2.5 text-sm"
              placeholder="Nhập giá nhập"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-slate-700">Ghi chú</label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={2}
              className="w-full border rounded-xl px-3 py-2.5 text-sm resize-none"
              placeholder="Ghi chú (tùy chọn)"
            />
          </div>

          {quantity && importPrice && (
            <div className="bg-blue-50 rounded-lg p-3 text-sm">
              Tổng tiền: <span className="font-bold text-blue-700">
                {(Number(quantity) * Number(importPrice)).toLocaleString('vi-VN')} ₫
              </span>
            </div>
          )}

          <div className="flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl border text-sm font-semibold"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-2.5 rounded-xl bg-emerald-600 text-white text-sm font-semibold disabled:opacity-60"
            >
              {loading ? 'Đang nhập...' : 'Xác nhận nhập kho'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
