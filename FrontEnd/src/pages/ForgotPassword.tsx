import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, Lock, KeyRound, ArrowRight, ArrowLeft, CheckCircle2, Loader2, ShieldCheck } from 'lucide-react';
import { authService } from '../services';

type Step = 'email' | 'otp' | 'reset' | 'success';

export const ForgotPassword: React.FC = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>('email');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (step === 'otp') {
      otpRefs.current[0]?.focus();
    }
  }, [step]);

  /** Gửi email để nhận OTP, chuyển sang bước nhập OTP nếu thành công. */
  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      await authService.forgotPassword(email);
      setStep('otp');
      setError('');
    } catch (err: any) {
      setError(
        err.response?.data?.message ||
          'Không thể gửi mã OTP. Vui lòng kiểm tra email và thử lại.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  /** Cập nhật ô OTP tại index, tự động focus sang ô tiếp theo khi nhập xong. */
  const handleOtpChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value.slice(-1);
    setOtp(newOtp);

    if (value && index < 5) {
      otpRefs.current[index + 1]?.focus();
    }
  };

  /** Xử lý phím Backspace trong ô OTP: focus về ô trước nếu ô hiện tại trống. */
  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  };

  /** Xác minh OTP với server, chuyển sang bước đặt lại mật khẩu nếu hợp lệ. */
  const handleOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    const otpValue = otp.join('');

    try {
      await authService.verifyOtp(email, otpValue);
      setStep('reset');
      setError('');
    } catch (err: any) {
      setError(
        err.response?.data?.message || 'Mã OTP không đúng hoặc đã hết hạn.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  /** Đặt lại mật khẩu mới sau khi xác minh OTP, kiểm tra khớp mật khẩu trước khi gửi. */
  const handleResetSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Mật khẩu xác nhận không khớp.');
      return;
    }

    if (password.length < 6) {
      setError('Mật khẩu phải có ít nhất 6 ký tự.');
      return;
    }

    setIsLoading(true);

    try {
      await authService.resetPassword(email, otp.join(''), password);
      setStep('success');
      setError('');
    } catch (err: any) {
      setError(
        err.response?.data?.message ||
          'Không thể đặt lại mật khẩu. Vui lòng thử lại.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900 p-4 relative overflow-hidden">
      {/* Background Decor */}
      <div className="absolute inset-0 w-full h-full pointer-events-none">
        <div className="absolute top-0 right-0 w-[40%] h-[40%] rounded-full bg-blue-500/10 blur-[120px]"></div>
        <div className="absolute bottom-0 left-0 w-[40%] h-[40%] rounded-full bg-indigo-500/10 blur-[120px]"></div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md bg-white/70 dark:bg-slate-800/70 backdrop-blur-2xl rounded-3xl shadow-2xl border border-white dark:border-slate-700/50 p-8 relative z-10"
      >
        <AnimatePresence mode="wait">
          {step === 'email' && (
            <motion.div
              key="email-step"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <div className="mb-8">
                <div className="w-14 h-14 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-2xl flex items-center justify-center mb-6">
                  <Mail size={28} />
                </div>
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Quên mật khẩu?</h2>
                <p className="text-slate-500 dark:text-slate-400 text-sm mt-2">
                  Nhập email của bạn để nhận mã xác thực OTP.
                </p>
              </div>

              <form onSubmit={handleEmailSubmit} className="space-y-6">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700 dark:text-slate-300 ml-1">
                    Email của bạn
                  </label>
                  <div className="relative group">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500" size={20} />
                    <input
                      required
                      type="email"
                      placeholder="email@techcare.vn"
                      className="w-full pl-11 pr-4 py-3.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/50 outline-none dark:text-white transition-all"
                      value={email}
                      onChange={(e) => setEmail(e.target.value.trim())}
                    />
                  </div>
                </div>

                {error && (
                  <p className="text-red-500 text-xs font-bold bg-red-50 dark:bg-red-900/20 p-3 rounded-lg border border-red-100 dark:border-red-900/30">
                    {error}
                  </p>
                )}

                <button
                  disabled={isLoading}
                  className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold py-4 rounded-xl shadow-lg shadow-blue-500/30 flex items-center justify-center gap-2 hover:-translate-y-0.5 transition-all disabled:opacity-70"
                >
                  {isLoading ? (
                    <Loader2 className="animate-spin" size={20} />
                  ) : (
                    <>
                      Gửi mã OTP <ArrowRight size={20} />
                    </>
                  )}
                </button>

                <Link
                  to="/"
                  className="flex items-center justify-center gap-2 text-sm font-bold text-slate-500 hover:text-slate-700 dark:text-slate-400 transition-colors"
                >
                  <ArrowLeft size={16} /> Quay lại đăng nhập
                </Link>
              </form>
            </motion.div>
          )}

          {step === 'otp' && (
            <motion.div
              key="otp-step"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <div className="mb-8">
                <div className="w-14 h-14 bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 rounded-2xl flex items-center justify-center mb-6">
                  <ShieldCheck size={28} />
                </div>
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Xác thực OTP</h2>
                <p className="text-slate-500 dark:text-slate-400 text-sm mt-2">
                  Mã đã được gửi đến <span className="text-slate-900 dark:text-white font-bold">{email}</span>
                </p>
              </div>

              <form onSubmit={handleOtpSubmit} className="space-y-8">
                <div className="flex justify-between gap-2">
                  {otp.map((digit, index) => (
                    <input
                      key={index}
                      ref={(el) => { otpRefs.current[index] = el; }}
                      type="text"
                      maxLength={1}
                      className="w-12 h-14 text-center text-xl font-bold rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                      value={digit}
                      onChange={(e) => handleOtpChange(index, e.target.value)}
                      onKeyDown={(e) => handleOtpKeyDown(index, e)}
                    />
                  ))}
                </div>

                {error && <p className="text-red-500 text-xs font-bold text-center">{error}</p>}

                <div className="space-y-4">
                  <button
                    disabled={isLoading}
                    className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold py-4 rounded-xl shadow-lg shadow-blue-500/30 flex items-center justify-center gap-2 disabled:opacity-70"
                  >
                    {isLoading ? <Loader2 className="animate-spin" size={20} /> : 'Xác nhận OTP'}
                  </button>

                  <button
                    type="button"
                    onClick={() => setStep('email')}
                    className="w-full text-sm font-bold text-blue-600 hover:text-blue-800"
                  >
                    Gửi lại mã
                  </button>
                </div>
              </form>
            </motion.div>
          )}

          {step === 'reset' && (
            <motion.div
              key="reset-step"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <div className="mb-8">
                <div className="w-14 h-14 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-2xl flex items-center justify-center mb-6">
                  <KeyRound size={28} />
                </div>
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Đặt lại mật khẩu</h2>
                <p className="text-slate-500 dark:text-slate-400 text-sm mt-2">
                  Vui lòng nhập mật khẩu mới bảo mật hơn.
                </p>
              </div>

              <form onSubmit={handleResetSubmit} className="space-y-6">
                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-500 uppercase px-1">Mật khẩu mới</label>
                    <div className="relative group">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                      <input
                        required
                        type="password"
                        placeholder="••••••••"
                        className="w-full pl-10 pr-4 py-3.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none dark:text-white transition-all"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-500 uppercase px-1">Xác nhận mật khẩu</label>
                    <div className="relative group">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                      <input
                        required
                        type="password"
                        placeholder="••••••••"
                        className="w-full pl-10 pr-4 py-3.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none dark:text-white transition-all"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                      />
                    </div>
                  </div>
                </div>

                {error && <p className="text-red-500 text-xs font-bold">{error}</p>}

                <button
                  disabled={isLoading}
                  className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold py-4 rounded-xl shadow-lg shadow-blue-500/30 flex items-center justify-center gap-2 disabled:opacity-70"
                >
                  {isLoading ? <Loader2 className="animate-spin" size={20} /> : 'Lưu mật khẩu mới'}
                </button>
              </form>
            </motion.div>
          )}

          {step === 'success' && (
            <motion.div
              key="success-step"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center py-4"
            >
              <div className="w-20 h-20 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-full flex items-center justify-center mb-6 mx-auto">
                <CheckCircle2 size={48} />
              </div>
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Thành công!</h2>
              <p className="text-slate-500 dark:text-slate-400 text-sm mt-3 px-4">
                Mật khẩu của bạn đã được thay đổi. Bây giờ bạn có thể sử dụng mật khẩu mới để đăng nhập.
              </p>
              <button
                onClick={() => navigate('/')}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-xl mt-8 shadow-xl shadow-blue-500/20 transition-all"
              >
                Đăng nhập ngay
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
};