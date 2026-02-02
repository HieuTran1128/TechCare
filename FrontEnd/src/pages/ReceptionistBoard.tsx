
import React, { useState } from 'react';
import { type Ticket, MOCK_TICKETS } from '../constants';
import { Smartphone, User, Phone, AlertCircle, Plus, Search, ClipboardList, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export const ReceptionistBoard: React.FC = () => {
    const [tickets, setTickets] = useState<Ticket[]>(MOCK_TICKETS);
    const [isSuccess, setIsSuccess] = useState(false);
    
    const [formData, setFormData] = useState({
        customerName: '',
        customerPhone: '',
        device: '',
        issue: '',
        priority: 'medium' as Ticket['priority']
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const newTicket: Ticket = {
            id: `#TC-${Math.floor(Math.random() * 9000) + 1000}`,
            customerName: formData.customerName,
            customerPhone: formData.customerPhone,
            device: formData.device,
            issue: formData.issue,
            priority: formData.priority,
            status: 'pending',
            deadline: 'Chờ xử lý',
            createdAt: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
        };

        setTickets([newTicket, ...tickets]);
        setIsSuccess(true);
        setFormData({ customerName: '', customerPhone: '', device: '', issue: '', priority: 'medium' });
        
        setTimeout(() => setIsSuccess(false), 3000);
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Cột trái: Form tiếp nhận */}
            <div className="lg:col-span-1 space-y-6">
                <div className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-xl p-8 rounded-3xl border border-white/20 dark:border-slate-700 shadow-xl">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-blue-500/30">
                            <Plus size={24} />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-slate-900 dark:text-white">Tiếp nhận mới</h2>
                            <p className="text-xs text-slate-500 dark:text-slate-400">Nhập thông tin khách hàng và máy</p>
                        </div>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-slate-500 uppercase flex items-center gap-2 px-1">
                                <User size={12} /> Tên khách hàng
                            </label>
                            <input 
                                required
                                type="text"
                                placeholder="VD: Anh Tuấn"
                                className="w-full bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm dark:text-white focus:ring-2 focus:ring-blue-500 transition-all outline-none"
                                value={formData.customerName}
                                onChange={e => setFormData({...formData, customerName: e.target.value})}
                            />
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-slate-500 uppercase flex items-center gap-2 px-1">
                                <Phone size={12} /> Số điện thoại
                            </label>
                            <input 
                                required
                                type="tel"
                                placeholder="090x xxx xxx"
                                className="w-full bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm dark:text-white focus:ring-2 focus:ring-blue-500 transition-all outline-none"
                                value={formData.customerPhone}
                                onChange={e => setFormData({...formData, customerPhone: e.target.value})}
                            />
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-slate-500 uppercase flex items-center gap-2 px-1">
                                <Smartphone size={12} /> Thiết bị
                            </label>
                            <input 
                                required
                                type="text"
                                placeholder="VD: iPhone 13 Pro Max"
                                className="w-full bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm dark:text-white focus:ring-2 focus:ring-blue-500 transition-all outline-none"
                                value={formData.device}
                                onChange={e => setFormData({...formData, device: e.target.value})}
                            />
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-slate-500 uppercase flex items-center gap-2 px-1">
                                <AlertCircle size={12} /> Tình trạng máy
                            </label>
                            <textarea 
                                required
                                rows={3}
                                placeholder="VD: Vỡ màn hình, cảm ứng bình thường..."
                                className="w-full bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm dark:text-white focus:ring-2 focus:ring-blue-500 transition-all outline-none resize-none"
                                value={formData.issue}
                                onChange={e => setFormData({...formData, issue: e.target.value})}
                            />
                        </div>

                        <div className="pt-2">
                            <button 
                                type="submit"
                                className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold py-4 rounded-2xl shadow-lg shadow-blue-500/30 hover:shadow-blue-500/50 transition-all active:scale-95 flex items-center justify-center gap-2"
                            >
                                <ClipboardList size={20} /> Tạo phiếu biên nhận
                            </button>
                        </div>
                    </form>

                    <AnimatePresence>
                        {isSuccess && (
                            <motion.div 
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0 }}
                                className="mt-4 p-3 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 text-sm font-bold rounded-xl flex items-center justify-center gap-2 border border-emerald-100 dark:border-emerald-800"
                            >
                                <CheckCircle2 size={18} /> Đã tạo phiếu thành công!
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>

            {/* Cột phải: Danh sách gần đây */}
            <div className="lg:col-span-2 space-y-6">
                <div className="flex justify-between items-center">
                    <h2 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                        <ClipboardList className="text-blue-500" /> Đơn mới tiếp nhận
                    </h2>
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                        <input type="text" placeholder="Tìm phiếu..." className="pl-10 pr-4 py-2 bg-white/50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-full text-xs outline-none focus:border-blue-500 dark:text-white" />
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {tickets.slice(0, 6).map((ticket, idx) => (
                        <motion.div 
                            key={ticket.id}
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: idx * 0.05 }}
                            className="bg-white/40 dark:bg-slate-800/40 backdrop-blur-md p-5 rounded-2xl border border-white/20 dark:border-slate-700 shadow-sm hover:shadow-md transition-all group"
                        >
                            <div className="flex justify-between items-start mb-4">
                                <div className="bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 p-2 rounded-lg group-hover:scale-110 transition-transform">
                                    <Smartphone size={20} />
                                </div>
                                <span className="text-[10px] font-mono font-black text-slate-400 dark:text-slate-500 bg-slate-50 dark:bg-slate-900 px-2 py-1 rounded">{ticket.id}</span>
                            </div>
                            
                            <h3 className="font-bold text-slate-900 dark:text-white mb-1">{ticket.device}</h3>
                            <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-1 mb-4">{ticket.issue}</p>
                            
                            <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-700">
                                <div className="flex items-center gap-2">
                                    <div className="w-6 h-6 rounded-full bg-slate-200 flex items-center justify-center text-[10px] font-bold text-slate-600 uppercase">
                                        {ticket.customerName.charAt(0)}
                                    </div>
                                    <span className="text-xs font-bold text-slate-700 dark:text-slate-300">{ticket.customerName}</span>
                                </div>
                                <span className="text-[10px] font-medium text-slate-400">{ticket.createdAt || 'Vừa xong'}</span>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>
        </div>
    );
};
