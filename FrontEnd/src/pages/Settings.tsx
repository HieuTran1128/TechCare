import React, { useState, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { User, Bell, Save, Upload, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

const Settings: React.FC = () => {
  const { user, updateAvatar, fetchUserProfile } = useAuth();

  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Xử lý khi chọn file
  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file
    if (!file.type.startsWith('image/')) {
      toast.error('Vui lòng chọn file ảnh (JPG, PNG, GIF)');
      return;
    }

    if (file.size > 800 * 1024) { // 800KB
      toast.error('Kích thước ảnh tối đa 800KB');
      return;
    }

    // Tạo preview tạm thời
    const previewUrl = URL.createObjectURL(file);
    setAvatarPreview(previewUrl);

    setIsUploading(true);

    try {
      await updateAvatar(file);
  toast.success('Cập nhật ảnh đại diện thành công!');
  await fetchUserProfile();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Có lỗi khi upload ảnh');
      setAvatarPreview(null); // rollback preview nếu fail
    } finally {
      setIsUploading(false);
      // Reset input để có thể chọn lại cùng file nếu cần
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  // Trigger click input file ẩn
  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 p-4 md:p-0">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Cài đặt</h1>
        <p className="text-slate-500 dark:text-slate-400 text-sm">
          Quản lý hồ sơ cá nhân và các tùy chọn hệ thống
        </p>
      </div>

      {/* Phần Hồ sơ cá nhân */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100 dark:border-slate-700">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white flex items-center gap-2">
            <User size={20} className="text-blue-500" />
            Hồ sơ cá nhân
          </h2>
        </div>

        <div className="p-6 space-y-6">
          {/* Avatar section */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
            <div className="relative shrink-0">
              <img
                src={
                  avatarPreview ||
                  user?.avatar ||
                  'https://ui-avatars.com/api/?name=' +
                    encodeURIComponent(user?.fullName || 'User') +
                    '&background=random&size=128'
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
                onClick={triggerFileInput}
                disabled={isUploading}
                className={`
                  flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg
                  border border-blue-600 text-blue-600 hover:bg-blue-50
                  disabled:opacity-50 disabled:cursor-not-allowed transition-colors
                  dark:hover:bg-blue-950/30
                `}
              >
                <Upload size={16} />
                Thay đổi ảnh đại diện
              </button>

              <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                Định dạng: JPG, PNG, GIF • Tối đa 800KB
              </p>
            </div>
          </div>

          {/* Thông tin cơ bản */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                Họ và tên
              </label>
              <input
                type="text"
                defaultValue={user?.fullName}
                className="w-full px-4 py-2.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition"
                placeholder="Nhập họ và tên"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                Email
              </label>
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

      {/* Phần Thông báo */}
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
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Nhận email khi có phiếu mới hoặc cập nhật quan trọng
              </p>
            </div>
            <input
              type="checkbox"
              defaultChecked
              className="w-5 h-5 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>

      {/* Nút lưu */}
      <div className="flex justify-end pt-4">
        <button
          type="button"
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-lg font-medium shadow-sm transition-colors disabled:opacity-50"
          // onClick={handleSave} 
        >
          <Save size={18} />
          Lưu thay đổi
        </button>
      </div>
    </div>
  );
};

export default Settings;