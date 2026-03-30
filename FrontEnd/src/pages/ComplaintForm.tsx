import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { authService } from '../services';

const CATEGORIES = [
  { value: 'SERVICE_QUALITY', label: 'Chất lượng dịch vụ' },
  { value: 'PRICE', label: 'Giá cả không hợp lý' },
  { value: 'TECHNICIAN', label: 'Thái độ kỹ thuật viên' },
  { value: 'TURNAROUND_TIME', label: 'Thời gian xử lý quá lâu' },
  { value: 'OTHER', label: 'Vấn đề khác' },
];

type FormState = 'loading' | 'ready' | 'submitting' | 'success' | 'error' | 'expired' | 'already';

export const ComplaintForm: React.FC = () => {
  const { token } = useParams<{ token: string }>();
  const [state, setState] = useState<FormState>('loading');
  const [info, setInfo] = useState<{ ticketCode: string; customerName: string; deviceBrand: string; deviceModel: string } | null>(null);
  const [categories, setCategories] = useState<string[]>([]);
  const [description, setDescription] = useState('');
  const [complaintCode, setComplaintCode] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (!token) { setState('error'); return; }
    authService.getComplaintForm(token)
      .then((data) => { setInfo(data); setState('ready'); })
      .catch((err) => {
        const msg = err.response?.data?.message;
        if (msg === 'TOKEN_EXPIRED') setState('expired');
        else if (msg === 'ALREADY_COMPLAINED') setState('already');
        else setState('error');
      });
  }, [token]);

  /** Gửi khiếu nại lên server, validate trước khi submit. */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (categories.length === 0) { setErrorMsg('Vui lòng chọn ít nhất một loại khiếu nại.'); return; }
    if (!description.trim() || description.trim().length < 10) { setErrorMsg('Vui lòng mô tả chi tiết (ít nhất 10 ký tự).'); return; }
    setErrorMsg('');
    setState('submitting');
    try {
      const res = await authService.submitComplaint(token!, { category: categories, description });
      setComplaintCode(res.complaintCode);
      setState('success');
    } catch (err: any) {
      const msg = err.response?.data?.message;
      if (msg === 'ALREADY_COMPLAINED') setState('already');
      else if (msg === 'TOKEN_EXPIRED') setState('expired');
      else { setErrorMsg(err.response?.data?.message || 'Có lỗi xảy ra, vui lòng thử lại.'); setState('ready'); }
    }
  };

  /** Toggle chọn/bỏ chọn một loại khiếu nại trong danh sách categories. */
  const toggleCategory = (val: string) => {
    setCategories((prev) =>
      prev.includes(val) ? prev.filter((c) => c !== val) : [...prev, val]
    );
  };

  if (state === 'loading') return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center">
      <div className="text-slate-500 text-sm">Đang tải...</div>
    </div>
  );

  if (state === 'expired') return <StatusPage icon="⏰" title="Liên kết đã hết hạn" desc="Liên kết khiếu nại chỉ có hiệu lực trong 7 ngày sau khi nhận máy. Vui lòng liên hệ trực tiếp cửa hàng." color="text-amber-600" />;
  if (state === 'already') return <StatusPage icon="✅" title="Đã gửi khiếu nại" desc="Khiếu nại của quý khách đã được ghi nhận trước đó. Chúng tôi sẽ phản hồi qua email sớm nhất." color="text-emerald-600" />;
  if (state === 'error') return <StatusPage icon="❌" title="Liên kết không hợp lệ" desc="Liên kết này không tồn tại hoặc đã bị vô hiệu hóa." color="text-rose-600" />;

  if (state === 'success') return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-sm border max-w-md w-full p-8 text-center space-y-4">
        <div className="text-5xl">🎉</div>
        <h2 className="text-xl font-bold text-slate-900">Khiếu nại đã được gửi</h2>
        <p className="text-slate-500 text-sm">Mã phiếu của quý khách:</p>
        <div className="bg-violet-50 border border-violet-200 rounded-xl px-4 py-3 font-mono font-bold text-violet-700 text-lg">{complaintCode}</div>
        <p className="text-slate-500 text-sm">Chúng tôi sẽ xem xét và phản hồi qua email trong thời gian sớm nhất. Xin cảm ơn quý khách đã phản hồi.</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-sm border max-w-lg w-full overflow-hidden">
        {/* Header */}
        <div style={{ background: 'linear-gradient(120deg,#7c3aed,#4f46e5)' }} className="px-8 py-6 text-white">
          <p className="text-xs font-semibold opacity-70 uppercase tracking-widest mb-1">TechCare Service</p>
          <h1 className="text-2xl font-bold">Gửi khiếu nại</h1>
          {info && (
            <div className="mt-3 bg-white/15 rounded-lg px-3 py-2 inline-block text-sm font-semibold">
              Mã phiếu: {info.ticketCode}
            </div>
          )}
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-5">
          {info && (
            <div className="bg-slate-50 rounded-xl p-4 text-sm space-y-1">
              <p className="text-slate-500">Khách hàng: <span className="font-semibold text-slate-800">{info.customerName}</span></p>
              {(info.deviceBrand || info.deviceModel) && (
                <p className="text-slate-500">Thiết bị: <span className="font-semibold text-slate-800">{info.deviceBrand} {info.deviceModel}</span></p>
              )}
            </div>
          )}

          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-700">Loại khiếu nại <span className="text-slate-400 font-normal">(có thể chọn nhiều)</span> *</label>
            <div className="grid grid-cols-1 gap-2">
              {CATEGORIES.map((c) => {
                const checked = categories.includes(c.value);
                return (
                  <label key={c.value} className={`flex items-center gap-3 border rounded-xl px-4 py-3 cursor-pointer transition-colors ${checked ? 'border-violet-500 bg-violet-50' : 'border-slate-200 hover:border-slate-300'}`}>
                    <input
                      type="checkbox"
                      value={c.value}
                      checked={checked}
                      onChange={() => toggleCategory(c.value)}
                      className="accent-violet-600 w-4 h-4"
                    />
                    <span className="text-sm text-slate-700">{c.label}</span>
                    {checked && <span className="ml-auto text-violet-500 text-xs font-semibold">✓</span>}
                  </label>
                );
              })}
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-700">Mô tả chi tiết *</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={5}
              className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm resize-none focus:outline-none focus:border-violet-400"
              placeholder="Vui lòng mô tả cụ thể vấn đề quý khách gặp phải..."
            />
            <p className="text-xs text-slate-400 text-right">{description.length} ký tự</p>
          </div>

          {errorMsg && (
            <div className="bg-rose-50 border border-rose-200 text-rose-700 rounded-xl px-4 py-3 text-sm">{errorMsg}</div>
          )}

          <button
            type="submit"
            disabled={state === 'submitting'}
            className="w-full py-3 rounded-xl font-bold text-white text-sm disabled:opacity-60"
            style={{ background: 'linear-gradient(120deg,#7c3aed,#4f46e5)' }}
          >
            {state === 'submitting' ? 'Đang gửi...' : 'Gửi khiếu nại'}
          </button>

          <p className="text-xs text-slate-400 text-center">Khiếu nại sẽ được gửi trực tiếp đến quản lý và phản hồi qua email của quý khách.</p>
        </form>
      </div>
    </div>
  );
};

const StatusPage = ({ icon, title, desc, color }: { icon: string; title: string; desc: string; color: string }) => (
  <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
    <div className="bg-white rounded-2xl shadow-sm border max-w-md w-full p-8 text-center space-y-4">
      <div className="text-5xl">{icon}</div>
      <h2 className={`text-xl font-bold ${color}`}>{title}</h2>
      <p className="text-slate-500 text-sm leading-relaxed">{desc}</p>
    </div>
  </div>
);
