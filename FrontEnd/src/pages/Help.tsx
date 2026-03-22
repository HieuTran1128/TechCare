import React from 'react';
import { HelpCircle, FileText, MessageCircle, Phone } from 'lucide-react';

export const Help: React.FC = () => {
    return (
        <div className="max-w-3xl mx-auto space-y-6">
            <div className="text-center py-8">
                <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">Trung tâm trợ giúp</h1>
                <p className="text-slate-500 dark:text-slate-400">Chúng tôi có thể giúp gì cho bạn?</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm text-center hover:border-blue-500 transition-colors cursor-pointer group">
                    <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                        <FileText size={24} />
                    </div>
                    <h3 className="font-bold text-slate-900 dark:text-white mb-1">Tài liệu</h3>
                    <p className="text-sm text-slate-500">Hướng dẫn sử dụng phần mềm</p>
                </div>
                <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm text-center hover:border-blue-500 transition-colors cursor-pointer group">
                    <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                        <MessageCircle size={24} />
                    </div>
                    <h3 className="font-bold text-slate-900 dark:text-white mb-1">ABCABC</h3>
                    <p className="text-sm text-slate-500">ABCABC</p>
                </div>
                <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm text-center hover:border-blue-500 transition-colors cursor-pointer group">
                    <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                        <Phone size={24} />
                    </div>
                    <h3 className="font-bold text-slate-900 dark:text-white mb-1">Hotline</h3>
                    <p className="text-sm text-slate-500">1900 1234 (24/7)</p>
                </div>
            </div>

            <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm p-6">
                <h3 className="font-bold text-slate-900 dark:text-white mb-4">Câu hỏi thường gặp</h3>
                <div className="space-y-4">
                    <details className="group">
                        <summary className="flex justify-between items-center font-medium cursor-pointer list-none text-slate-700 dark:text-slate-300">
                            <span>Làm sao để tạo phiếu sửa chữa mới?</span>
                            <span className="transition group-open:rotate-180">
                                <svg fill="none" height="24" shapeRendering="geometricPrecision" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" viewBox="0 0 24 24" width="24"><path d="M6 9l6 6 6-6"></path></svg>
                            </span>
                        </summary>
                        <p className="text-slate-500 mt-3 group-open:animate-fadeIn">
                            Vào menu "Kỹ thuật viên", nhấn nút "Thêm việc" ở góc phải màn hình, điền thông tin và lưu lại.
                        </p>
                    </details>
                    <div className="border-t border-slate-100 dark:border-slate-700"></div>
                     <details className="group">
                        <summary className="flex justify-between items-center font-medium cursor-pointer list-none text-slate-700 dark:text-slate-300">
                            <span>Tôi quên mật khẩu thì làm sao?</span>
                            <span className="transition group-open:rotate-180">
                                <svg fill="none" height="24" shapeRendering="geometricPrecision" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" viewBox="0 0 24 24" width="24"><path d="M6 9l6 6 6-6"></path></svg>
                            </span>
                        </summary>
                        <p className="text-slate-500 mt-3 group-open:animate-fadeIn">
                            Liên hệ Admin để reset mật khẩu hoặc gửi email đến support@techcare.vn.
                        </p>
                    </details>
                </div>
            </div>
        </div>
    );
}