import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import axios from 'axios';

const API_BASE = 'http://localhost:3000/api'; // điều chỉnh nếu cần
console.log('[Activate.tsx] File này ĐÃ được import và chạy');
export default function Activate() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const token = searchParams.get('token');

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    console.log('[Activate] Token từ searchParams:', token);
    console.log('[Activate] All search params:', Object.fromEntries(searchParams));
  }, [searchParams, token]);

  // ─── LOGGING ────────────────────────────────
  useEffect(() => {
    console.log('[Activate] Component mounted');
    console.log('[Activate] Current URL:', window.location.href);
    console.log('[Activate] Token từ query:', token);
    console.log('[Activate] React Router searchParams:', Object.fromEntries(searchParams));
  }, [searchParams, token]);

  useEffect(() => {
    if (!token) {
      const errMsg = 'Link không hợp lệ. Vui lòng kiểm tra lại email.';
      setError(errMsg);
      console.warn('[Activate] No token found →', errMsg);
    }
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');

    console.log('[Activate] Form submit triggered');
    console.log('[Activate] Password length:', password.length);
    console.log('[Activate] Token gửi đi:', token);

    if (password !== confirmPassword) {
      const errMsg = 'Mật khẩu xác nhận không khớp';
      setError(errMsg);
      console.warn('[Activate] Validation fail:', errMsg);
      return;
    }

    if (password.length < 6) {
      const errMsg = 'Mật khẩu phải có ít nhất 6 ký tự';
      setError(errMsg);
      console.warn('[Activate] Validation fail:', errMsg);
      return;
    }

    setLoading(true);
    console.log('[Activate] Bắt đầu gọi API activate...');

    try {
      const response = await axios.post(
        `${API_BASE}/auth/activate`,
        { token, password },
        { withCredentials: true }
      );

      console.log('[Activate] API success:', response.data);

      const successMsg = 'Kích hoạt tài khoản thành công! Đang chuyển hướng...';
      setMessage(successMsg);
      console.info('[Activate]', successMsg);

      setTimeout(() => {
        console.log('[Activate] Chuyển hướng sang /login');
        navigate('/login');
      }, 2500);
    } catch (err: any) {
      console.error('[Activate] API error:', err);

      let errMsg = 'Có lỗi xảy ra khi kích hoạt tài khoản';

      if (err.response) {
        // Lỗi từ server (4xx, 5xx)
        console.error('[Activate] Response data:', err.response.data);
        console.error('[Activate] Status:', err.response.status);
        errMsg = err.response.data?.message || errMsg;
      } else if (err.request) {
        // Không nhận được response (mạng, CORS, server chết...)
        console.error('[Activate] No response received. Request:', err.request);
        errMsg = 'Không kết nối được đến server. Kiểm tra mạng hoặc server backend.';
      } else {
        // Lỗi khác (ví dụ setup axios sai)
        console.error('[Activate] Error message:', err.message);
        errMsg = err.message || errMsg;
      }

      if (errMsg.includes('INVALID_TOKEN') || errMsg === 'INVALID_TOKEN') {
        errMsg = 'Token không hợp lệ hoặc đã được sử dụng';
      } else if (errMsg.includes('EXPIRED') || errMsg === 'EXPIRED') {
        errMsg = 'Link đã hết hạn (hiệu lực 24 giờ)';
      }

      setError(errMsg);
      console.error('[Activate] Hiển thị lỗi cho người dùng:', errMsg);
    } finally {
      setLoading(false);
      console.log('[Activate] Xong xử lý submit (loading = false)');
    }
  };

  // Log mỗi khi render lại (giúp phát hiện re-render loop)
  console.log('[Activate] Rendering... error:', error, 'message:', message, 'loading:', loading);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 px-4">
      <div className="bg-white dark:bg-gray-800 p-8 rounded-xl shadow-lg w-full max-w-md">
        <h1 className="text-2xl font-bold text-center mb-6">Kích hoạt tài khoản</h1>

        {message && (
          <div className="mb-6 p-4 bg-green-100 text-green-800 rounded-lg text-center">
            {message}
          </div>
        )}

        {error && (
          <div className="mb-6 p-4 bg-red-100 text-red-800 rounded-lg text-center">
            {error}
          </div>
        )}

        {!message && (
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium mb-1">Mật khẩu mới</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
                minLength={6}
                disabled={loading}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Nhập lại mật khẩu</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full px-4 py-3 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
                disabled={loading}
              />
            </div>

            <button
              type="submit"
              disabled={loading || !token || !!message}
              className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Đang xử lý...' : 'Hoàn tất kích hoạt'}
            </button>
          </form>
        )}

        <p className="text-center mt-6 text-sm text-gray-500">
          <a href="/login" className="text-blue-600 hover:underline">Quay về trang đăng nhập</a>
        </p>

        {/* Debug helper - chỉ hiện khi dev */}
        {process.env.NODE_ENV === 'development' && (
          <div className="mt-8 text-xs text-gray-500 text-center">
            Debug: token = {token || 'không có'} | loading = {loading.toString()}
          </div>
        )}
      </div>
    </div>
  );
}