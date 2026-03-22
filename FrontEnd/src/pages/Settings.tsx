import React, { useEffect, useRef, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { User, Bell, Save, Upload, Loader2, Lock } from 'lucide-react';
import toast from 'react-hot-toast';
import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api';

const Settings: React.FC = () => {
  const { user, updateAvatar, fetchUserProfile } = useAuth();

  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [emailNotify, setEmailNotify] = useState(true);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [profileError, setProfileError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [avatarError, setAvatarError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setFullName(user?.fullName || '');
    setPhone((user as any)?.phone || '');
  }, [user]);

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setAvatarError('Vui lòng chọn file ảnh (JPG, PNG, GIF)');
      return;
    }

    if (file.size > 800 * 1024) {
      setAvatarError('Kích thước ảnh tối đa 800KB');
      return;
    }

    const previewUrl = URL.createObjectURL(file);
    setAvatarPreview(previewUrl);
    setAvatarError(null);
    setIsUploading(true);

    try {
      await updateAvatar(file);
      await fetchUserProfile();
    } catch (err: any) {
      setAvatarError(err.response?.data?.message || 'Có lỗi khi upload ảnh');
      setAvatarPreview(null);
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleSave = async () => {
    if (!fullName.trim()) {
      setProfileError('Họ và tên không được để trống');
      return;
    }

    setProfileError(null);
    setIsSavingProfile(true);
    try {
      await axios.patch(
        `${API_BASE}/users/profile`,
        {
          fullName: fullName.trim(),
          phone: phone.trim(),
        },
        { withCredentials: true },
      );

      await fetchUserProfile();
      toast.success('Đã lưu thông tin hồ sơ');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Không thể lưu hồ sơ');
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleChangePassword = async () => {
    if (!currentPassword) {
      setPasswordError('Vui lòng nhập mật khẩu hiện tại');
      return;
    }
    if (!newPassword) {
      setPasswordError('Vui lòng nhập mật khẩu mới');
      return;
    }
    if (newPassword.length < 6) {
      setPasswordError('Mật khẩu mới phải có ít nhất 6 ký tự');
      return;
    }
    if (newPassword !== confirmNewPassword) {
      setPasswordError('Xác nhận mật khẩu mới không khớp');
      return;
    }

    setPasswordError(null);
    setIsChangingPassword(true);
    try {
      await axios.patch(
        `${API_BASE}/users/password`,
        { currentPassword, newPassword },
        { withCredentials: true },
      );

      setCurrentPassword('');
      setNewPassword('');
      setConfirmNewPassword('');
      toast.success('Đổi mật khẩu thành công');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Không thể đổi mật khẩu');
    } finally {
      setIsChangingPassword(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 p-4 md:p-0">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Cài đặt</h1>
        <p className="text-slate-500 dark:text-slate-400 text-sm">Quản lý hồ sơ cá nhân và các tùy chọn hệ thống</p>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100 dark:border-slate-700">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white flex items-center gap-2">
            <User size={20} className="text-blue-500" />
            Hồ sơ cá nhân
          </h2>
        </div>

        <div className="p-6 space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
            <div className="relative shrink-0">
              <img
                src={
                  avatarPreview ||
                  user?.avatar ||
                  'https://ui-avatars.com/api/?name=' + encodeURIComponent(user?.fullName || 'User') + '&background=random&size=128'
                }
                alt="Avatar"
                className="w-20 h-20 rounded-full object-cover border-4 border-slate-200 dark:border-slate-600 shadow-md"
              />

              {isUploading && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full">
                  <Loader2 className="w-8 h-8 text-white animate-spin" />
                </div>
              )}
            </div>

            <div>
              <input
                type="file"
                ref={fileInputRef}
                accept="image/jpeg,image/png,image/gif"
                onChange={handleAvatarChange}
                className="hidden"
              />

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg border border-blue-600 text-blue-600 hover:bg-blue-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors dark:hover:bg-blue-950/30"
              >
                <Upload size={16} />
                Thay đổi ảnh đại diện
              </button>

              <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">Định dạng: JPG, PNG, GIF • Tối đa 800KB</p>
              {avatarError && <p className="mt-2 text-xs text-red-600 dark:text-red-400">{avatarError}</p>}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Họ và tên</label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full px-4 py-2.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition"
                placeholder="Nhập họ và tên"
              />
              {profileError && <p className="mt-2 text-xs text-red-600 dark:text-red-400">{profileError}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Số điện thoại</label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full px-4 py-2.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition"
                placeholder="Nhập số điện thoại"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Email</label>
              <input
                type="email"
                value={user?.email || ''}
                disabled
                className="w-full px-4 py-2.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-slate-100 dark:bg-slate-800 text-slate-500 cursor-not-allowed"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100 dark:border-slate-700">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white flex items-center gap-2">
            <Lock size={20} className="text-emerald-500" />
            Bảo mật
          </h2>
        </div>
        <div className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Mật khẩu hiện tại</label>
              <input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="w-full px-4 py-2.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition"
                placeholder="Nhập mật khẩu hiện tại"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Mật khẩu mới</label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full px-4 py-2.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition"
                placeholder="Tối thiểu 6 ký tự"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Xác nhận mật khẩu mới</label>
              <input
                type="password"
                value={confirmNewPassword}
                onChange={(e) => setConfirmNewPassword(e.target.value)}
                className="w-full px-4 py-2.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition"
                placeholder="Nhập lại mật khẩu mới"
              />
            </div>
          </div>

          {passwordError && <p className="text-sm text-red-600 dark:text-red-400">{passwordError}</p>}

          <div className="flex justify-end">
            <button
              type="button"
              onClick={handleChangePassword}
              disabled={isChangingPassword}
              className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-2.5 rounded-lg font-medium shadow-sm transition-colors disabled:opacity-50"
            >
              {isChangingPassword ? <Loader2 size={18} className="animate-spin" /> : <Lock size={18} />}
              {isChangingPassword ? 'Đang đổi...' : 'Đổi mật khẩu'}
            </button>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100 dark:border-slate-700">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white flex items-center gap-2">
            <Bell size={20} className="text-orange-500" />
            Thông báo
          </h2>
        </div>
        <div className="p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-slate-900 dark:text-white">Email thông báo</p>
              <p className="text-sm text-slate-500 dark:text-slate-400">Nhận email khi có phiếu mới hoặc cập nhật quan trọng</p>
            </div>
            <input
              type="checkbox"
              checked={emailNotify}
              onChange={(e) => setEmailNotify(e.target.checked)}
              className="w-5 h-5 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>

      <div className="flex justify-end pt-4">
        <button
          type="button"
          onClick={handleSave}
          disabled={isSavingProfile}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-lg font-medium shadow-sm transition-colors disabled:opacity-50"
        >
          {isSavingProfile ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
          {isSavingProfile ? 'Đang lưu...' : 'Lưu thay đổi'}
        </button>
      </div>
    </div>
  );
};

export default Settings;
