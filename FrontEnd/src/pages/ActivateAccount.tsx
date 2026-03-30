import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { authService } from '../services';

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
    if (!token) setError('Link không hợp lệ. Vui lòng kiểm tra lại email.');
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');

    if (password !== confirmPassword) { setError('Mật khẩu xác nhận không khớp'); return; }
    if (password.length < 6) { setError('Mật khẩu phải có ít nhất 6 ký tự'); return; }

    setLoading(true);
    try {
      await authService.activate(token!, password);
      setMessage('Kích hoạt tài khoản thành công! Đang chuyển hướng...');
      setTimeout(() => navigate('/'), 2500);
    } catch (err: any) {
      const msg = err.response?.data?.message || '';
      if (msg === 'INVALID_TOKEN') setError('Token không hợp lệ hoặc đã được sử dụng');
      else if (msg.includes('EXPIRED')) setError('Link đã hết hạn (hiệu lực 24 giờ)');
      else if (!err.response) setError('Không kết nối được đến server. Kiểm tra mạng hoặc server backend.');
      else setError(msg || 'Có lỗi xảy ra khi kích hoạt tài khoản');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 px-4">
      <div className="bg-white dark:bg-gray-800 p-8 rounded-xl shadow-lg w-full max-w-md">
        <h1 className="text-2xl font-bold text-center mb-6">Kích hoạt tài khoản</h1>

        {message && (
          <div className="mb-6 p-4 bg-green-100 text-green-800 rounded-lg text-center">{message}</div>
        )}

        {error && (
          <div className="mb-6 p-4 bg-red-100 text-red-800 rounded-lg text-center">{error}</div>
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
          <a href="/" className="text-blue-600 hover:underline">Quay về trang đăng nhập</a>
        </p>
      </div>
    </div>
  );
}
