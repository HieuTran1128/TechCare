import React, { useState } from 'react';
import { MOCK_TRACKING, type TrackingInfo } from '../constants';
import { Search, CheckCircle, Circle, Wrench, Clock, Phone, MessageCircle, ArrowLeft, AlertTriangle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export const CustomerTracking: React.FC = () => {
  const [searchCode, setSearchCode] = useState(MOCK_TRACKING.id);
  const [trackingData, setTrackingData] = useState<TrackingInfo | null>(MOCK_TRACKING);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const navigate = useNavigate();
  const { user } = useAuth();

  const handleSearch = () => {
    if(!searchCode) return;
    setIsLoading(true);
    setError('');
    setTrackingData(null);

    // Simulate API call
    setTimeout(() => {
        setIsLoading(false);
        if (searchCode.toUpperCase() === MOCK_TRACKING.id) {
            setTrackingData(MOCK_TRACKING);
        } else {
            setError('Không tìm thấy phiếu sửa chữa. Vui lòng kiểm tra lại mã.');
        }
    }, 800);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-12 pt-4">
        {/* Navigation for public users */}
        {!user && (
            <div className="flex justify-start px-4 md:px-0">
                <button 
                    onClick={() => navigate('/')}
                    className="flex items-center gap-2 text-slate-500 hover:text-blue-600 dark:text-slate-400 dark:hover:text-blue-400 transition-colors font-medium text-sm px-4 py-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                    <ArrowLeft size={18} />
                    Quay lại đăng nhập
                </button>
            </div>
        )}

        {/* Header Section */}
        <div className="text-center py-4 px-4">
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">Tra cứu trạng thái sửa chữa</h1>
            <p className="text-slate-500 dark:text-slate-400">Nhập mã phiếu in trên biên nhận để theo dõi tiến độ.</p>
            
            <div className="mt-8 max-w-lg mx-auto relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                <input 
                    type="text" 
                    value={searchCode}
                    onChange={(e) => setSearchCode(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                    placeholder="VD: TC-83921"
                    className="w-full h-12 pl-12 pr-32 rounded-full border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-lg shadow-sm focus:ring-0 focus:border-blue-500 dark:text-white"
                />
                <button 
                    onClick={handleSearch}
                    disabled={isLoading}
                    className="absolute right-1.5 top-1.5 bottom-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-full px-6 font-medium transition-colors disabled:bg-blue-400"
                >
                    {isLoading ? '...' : 'Tra cứu'}
                </button>
            </div>
        </div>

        {/* Error State */}
        {error && (
            <div className="mx-4 flex flex-col items-center justify-center p-8 bg-red-50 dark:bg-red-900/20 rounded-2xl border border-red-100 dark:border-red-900/30">
                <AlertTriangle className="w-12 h-12 text-red-500 mb-3" />
                <p className="text-red-600 dark:text-red-400 font-medium">{error}</p>
            </div>
        )}

        {/* Status Card */}
        {trackingData && !isLoading && (
            <div className="mx-4 md:mx-0 bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-slate-100 dark:border-slate-700 overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="bg-slate-50 dark:bg-slate-900/50 p-6 border-b border-slate-100 dark:border-slate-700 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                        <div className="flex items-center gap-3 mb-1">
                            <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Phiếu #{trackingData.id}</h2>
                            <span className="bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-xs px-2.5 py-0.5 rounded-full font-bold uppercase">Đang xử lý</span>
                        </div>
                        <p className="text-sm text-slate-500 dark:text-slate-400">Khách hàng: {trackingData.customerName}</p>
                    </div>
                    <div className="text-right">
                        <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">Dự kiến hoàn thành</p>
                        <p className="text-lg font-bold text-slate-900 dark:text-white">{trackingData.estimatedCompletion}</p>
                    </div>
                </div>

                <div className="p-8">
                    {/* Timeline */}
                    <div className="relative overflow-x-auto pb-4 md:pb-0">
                        <div className="min-w-[500px]">
                            {/* Progress Bar Background */}
                            <div className="absolute left-0 top-5 w-full h-1 bg-slate-100 dark:bg-slate-700 rounded-full -z-10"></div>
                            
                            <div className="flex justify-between w-full">
                                {trackingData.steps.map((step, index) => {
                                    const isCompleted = step.status === 'completed';
                                    const isCurrent = step.status === 'current';
                                    
                                    return (
                                        <div key={index} className="flex flex-col items-center relative group w-32">
                                            {/* Line connector logic (visual only) */}
                                            {index > 0 && (
                                                <div className={`absolute top-5 right-[50%] w-full h-1 -z-10 
                                                    ${isCompleted || isCurrent ? 'bg-blue-600' : 'bg-transparent'}`}></div>
                                            )}

                                            <div className={`w-10 h-10 rounded-full flex items-center justify-center border-4 mb-3 transition-all duration-500
                                                ${isCompleted ? 'bg-blue-600 border-white dark:border-slate-800 text-white' : 
                                                isCurrent ? 'bg-blue-600 border-blue-200 dark:border-blue-900 text-white scale-110' : 
                                                'bg-white dark:bg-slate-700 border-slate-100 dark:border-slate-600 text-slate-300'}`}>
                                                {isCompleted ? <CheckCircle size={18} /> : 
                                                isCurrent ? <Wrench size={18} className="animate-pulse" /> : 
                                                <Circle size={14} />}
                                            </div>
                                            
                                            <div className="text-center">
                                                <p className={`text-sm font-bold mb-1 ${isCompleted || isCurrent ? 'text-blue-600 dark:text-blue-400' : 'text-slate-400'}`}>
                                                    {step.title}
                                                </p>
                                                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">{step.date}</p>
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                        </div>
                    </div>

                    {/* Details Grid */}
                    <div className="mt-12 grid grid-cols-1 lg:grid-cols-2 gap-8">
                        <div className="bg-slate-50 dark:bg-slate-700/20 rounded-xl p-6">
                            <h3 className="flex items-center gap-2 text-lg font-bold text-slate-900 dark:text-white mb-4">
                                <Laptop size={20} className="text-blue-600" /> Thông tin thiết bị
                            </h3>
                            <dl className="space-y-4 text-sm">
                                <div className="flex justify-between">
                                    <dt className="text-slate-500 dark:text-slate-400">Thiết bị</dt>
                                    <dd className="font-semibold text-slate-900 dark:text-white">{trackingData.device}</dd>
                                </div>
                                <div className="flex justify-between">
                                    <dt className="text-slate-500 dark:text-slate-400">Lỗi gặp phải</dt>
                                    <dd className="font-semibold text-slate-900 dark:text-white text-right max-w-[200px]">{trackingData.issue}</dd>
                                </div>
                                <div className="flex justify-between">
                                    <dt className="text-slate-500 dark:text-slate-400">Kỹ thuật viên</dt>
                                    <dd className="font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                                        <div className="w-5 h-5 rounded-full bg-slate-200 flex items-center justify-center text-[10px] text-slate-600">NV</div>
                                        {trackingData.technician}
                                    </dd>
                                </div>
                            </dl>
                        </div>

                        <div>
                            <h3 className="flex items-center gap-2 text-lg font-bold text-slate-900 dark:text-white mb-4">
                                <div className="w-5 h-5 rounded bg-blue-600 flex items-center justify-center"><span className="text-white text-xs">IMG</span></div> Hình ảnh tiếp nhận
                            </h3>
                            <div className="grid grid-cols-2 gap-3">
                                <div className="aspect-[4/3] rounded-lg bg-slate-200 dark:bg-slate-700 bg-cover bg-center" style={{backgroundImage: 'url(https://picsum.photos/300/200?random=10)'}}></div>
                                <div className="aspect-[4/3] rounded-lg bg-slate-200 dark:bg-slate-700 bg-cover bg-center relative" style={{backgroundImage: 'url(https://picsum.photos/300/200?random=11)'}}>
                                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center rounded-lg">
                                        <span className="text-white text-xs font-bold">+1 ảnh khác</span>
                                    </div>
                                </div>
                            </div>

                            <div className="mt-6 p-4 rounded-lg bg-blue-50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-900/20">
                                <h4 className="font-bold text-slate-900 dark:text-white text-sm mb-1">Cần hỗ trợ gấp?</h4>
                                <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">Liên hệ ngay nếu bạn có thắc mắc.</p>
                                <div className="flex gap-4">
                                    <a href="#" onClick={e=>e.preventDefault()} className="text-blue-600 dark:text-blue-400 text-sm font-semibold flex items-center gap-1 hover:underline">
                                        <MessageCircle size={16} /> Chat Zalo
                                    </a>
                                    <a href="#" onClick={e=>e.preventDefault()} className="text-blue-600 dark:text-blue-400 text-sm font-semibold flex items-center gap-1 hover:underline">
                                        <Phone size={16} /> 1900 1234
                                    </a>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        )}
    </div>
  );
};

// Simple Icon component used above locally
const Laptop = ({size, className}: any) => (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M20 16V7a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v9m16 0H4m16 0 1.28 2.55a1 1 0 0 1-.9 1.45H3.62a1 1 0 0 1-.9-1.45L4 16"/></svg>
);