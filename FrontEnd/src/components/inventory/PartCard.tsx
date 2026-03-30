import React from 'react';
import type { Part } from '../../types';

interface PartCardProps {
  part: Part;
  onEdit: (part: Part) => void;
  onDelete: (id: string) => void;
  onImport: (part: Part) => void;
  onAlert: (part: Part) => void;
}

export const PartCard: React.FC<PartCardProps> = ({
  part,
  onEdit,
  onDelete,
  onImport,
  onAlert,
}) => {
  const stockStatus = part.stock <= 0 ? 'out' : part.stock < part.minStock ? 'low' : 'ok';
  const statusColors = {
    out: 'bg-red-50 border-red-200',
    low: 'bg-amber-50 border-amber-200',
    ok: 'bg-white border-slate-200',
  };

  return (
    <div className={`border rounded-xl p-4 ${statusColors[stockStatus]}`}>
      <img
        src={part.imageUrl || 'https://via.placeholder.com/150'}
        alt={part.partName}
        className="w-full h-32 object-cover rounded-lg mb-3"
      />
      <h3 className="font-semibold text-slate-900">{part.partName}</h3>
      {part.brand && <p className="text-xs text-slate-500">{part.brand}</p>}
      <div className="mt-2 space-y-1 text-sm">
        <p className="text-slate-700">
          Giá: <span className="font-semibold">{part.price.toLocaleString('vi-VN')} ₫</span>
        </p>
        <p className={`font-semibold ${stockStatus === 'out' ? 'text-red-600' : stockStatus === 'low' ? 'text-amber-600' : 'text-emerald-600'}`}>
          Tồn: {part.stock} / {part.minStock}
        </p>
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        <button
          onClick={() => onEdit(part)}
          className="px-3 py-1.5 rounded-lg bg-blue-600 text-white text-xs font-semibold"
        >
          Sửa
        </button>
        <button
          onClick={() => onImport(part)}
          className="px-3 py-1.5 rounded-lg bg-emerald-600 text-white text-xs font-semibold"
        >
          Nhập kho
        </button>
        <button
          onClick={() => onAlert(part)}
          className="px-3 py-1.5 rounded-lg border text-xs font-semibold"
        >
          Cảnh báo
        </button>
        <button
          onClick={() => onDelete(part._id)}
          className="px-3 py-1.5 rounded-lg border border-red-200 text-red-600 text-xs font-semibold"
        >
          Xóa
        </button>
      </div>
    </div>
  );
};
