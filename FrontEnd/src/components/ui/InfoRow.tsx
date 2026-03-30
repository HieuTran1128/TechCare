// Component InfoRow - đang duplicate trong ComplaintManagement

import React from 'react';

interface InfoRowProps {
  label: string;
  value?: React.ReactNode;
  mono?: boolean;
  className?: string;
}

/**
 * InfoRow: Hiển thị một dòng label-value trong modal/card.
 * mono=true → dùng font monospace cho mã code, số tiền...
 */
export const InfoRow: React.FC<InfoRowProps> = ({
  label,
  value,
  mono = false,
  className = '',
}) => {
  return (
    <div
      className={`flex justify-between items-start gap-2 py-1.5 border-b border-slate-100 last:border-0 ${className}`}
    >
      <span className="text-xs text-slate-500 shrink-0 w-36">{label}</span>
      <span
        className={`text-xs font-medium text-slate-800 text-right ${
          mono ? 'font-mono' : ''
        }`}
      >
        {value || '—'}
      </span>
    </div>
  );
};
