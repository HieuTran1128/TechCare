import React, { useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { CheckCircle2, Home, RefreshCw, XCircle } from 'lucide-react';

export const PaymentResult: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const { status, ticket } = useMemo(() => {
    const params = new URLSearchParams(location.search);
    return {
      status: params.get('status') || '',
      ticket: params.get('ticket') || '',
    };
  }, [location.search]);

  const isSuccess = status === 'success';

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-b from-slate-50 to-indigo-50">
      <div className="w-full max-w-lg bg-white border border-slate-200 rounded-3xl shadow-[0_20px_50px_rgba(15,23,42,.12)] p-8 text-center">
        <div className="mx-auto w-20 h-20 rounded-full grid place-items-center mb-4 bg-slate-50">
          {isSuccess ? (
            <CheckCircle2 className="text-emerald-600" size={44} />
          ) : (
            <XCircle className="text-rose-600" size={44} />
          )}
        </div>

        <h1 className="text-2xl font-black tracking-tight text-slate-900">
          {isSuccess ? 'Thanh toán thành công' : 'Thanh toán chưa hoàn tất'}
        </h1>

        <p className="text-slate-600 mt-3">
          {isSuccess
            ? 'Cảm ơn bạn! Hệ thống đã ghi nhận giao dịch. Vui lòng chụp màn hình này để đối chiếu khi cần.'
            : 'Bạn đã hủy hoặc chưa hoàn tất thanh toán. Vui lòng liên hệ lễ tân để được hỗ trợ.'}
        </p>

        {ticket && (
          <div className="mt-5 inline-flex items-center px-3 py-1.5 rounded-full bg-slate-100 text-slate-700 text-sm font-semibold">
            Mã phiếu: {ticket}
          </div>
        )}

        <div className="mt-7 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 text-sm font-semibold inline-flex items-center gap-2"
          >
            <RefreshCw size={14} /> Tải lại trang
          </button>
          <button
            onClick={() => navigate('/')}
            className="px-4 py-2 rounded-xl bg-slate-900 text-white text-sm font-semibold inline-flex items-center gap-2"
          >
            <Home size={14} /> Về trang đăng nhập
          </button>
        </div>
      </div>
    </div>
  );
};