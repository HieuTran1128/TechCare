import React, { useState } from 'react';
import { MOCK_TICKETS, type Ticket } from '../constants';
import { MoreHorizontal, Plus, Clock, Smartphone, Laptop, Tablet, ArrowRight, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const TICKET_TYPES = ['iPhone', 'iPad', 'MacBook', 'Samsung', 'Dell', 'Xiaomi'];
const PRIORITIES = ['low', 'medium', 'high'] as const;

export const TechnicianBoard: React.FC = () => {
    const [tickets, setTickets] = useState<Ticket[]>(MOCK_TICKETS);
    const [filterTech, setFilterTech] = useState('All');
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);

    // New Ticket State
    const [newTicket, setNewTicket] = useState({
        device: '',
        issue: '',
        customerName: '',
        priority: 'medium'
    });

    const moveTicket = (id: string, currentStatus: string) => {
        let newStatus: Ticket['status'];
        if (currentStatus === 'pending') newStatus = 'in-progress';
        else if (currentStatus === 'in-progress') newStatus = 'completed';
        else return;

        setTickets(tickets.map(t => t.id === id ? { ...t, status: newStatus } : t));
    };

    const handleAddTicket = (e: React.FormEvent) => {
        e.preventDefault();
        const ticket: Ticket = {
            id: `#TC-${Math.floor(Math.random() * 9000) + 1000}`,
            device: newTicket.device || 'Thiết bị mới',
            issue: newTicket.issue || 'Kiểm tra',
            status: 'pending',
            customerName: newTicket.customerName || 'Khách vãng lai',
            deadline: 'Mới nhận',
            priority: newTicket.priority as 'low'|'medium'|'high'
        };
        setTickets([...tickets, ticket]);
        setIsAddModalOpen(false);
        setNewTicket({ device: '', issue: '', customerName: '', priority: 'medium' });
    };

    const deleteTicket = (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        if(window.confirm('Xóa phiếu này?')) {
             setTickets(tickets.filter(t => t.id !== id));
        }
    };

    const filteredTickets = filterTech === 'All' ? tickets : tickets;

    const Column = ({ title, status, color, borderColor }: { title: string, status: string, color: string, borderColor: string }) => {
        const columnTickets = filteredTickets.filter(t => t.status === status);
        
        return (
            <div className="flex-1 min-w-[320px] flex flex-col h-full rounded-2xl bg-white/40 dark:bg-slate-800/40 backdrop-blur-xl border border-white/30 dark:border-slate-700 shadow-xl overflow-hidden">
                <div className={`p-4 flex items-center justify-between border-b border-white/20 dark:border-slate-700/50 bg-white/30 dark:bg-slate-900/30 ${borderColor} border-t-4`}>
                    <div className="flex items-center gap-2">
                        <div className={`w-3 h-3 rounded-full ${color} shadow-lg shadow-${color.replace('bg-', '')}/50`}></div>
                        <h2 className="font-bold text-slate-800 dark:text-slate-100">{title}</h2>
                        <span className="bg-white/50 dark:bg-slate-700 text-slate-600 dark:text-slate-300 px-2.5 py-0.5 rounded-full text-xs font-bold shadow-sm">{columnTickets.length}</span>
                    </div>
                </div>
                
                <div className="flex-1 p-3 overflow-y-auto space-y-3 custom-scrollbar">
                    <AnimatePresence>
                    {columnTickets.map((ticket) => (
                    <motion.div 
                        key={ticket.id} 
                        initial={{ opacity: 0, y: 20, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        transition={{ type: "spring", bounce: 0.3 }}
                        className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700 cursor-grab active:cursor-grabbing hover:shadow-lg hover:border-blue-300 dark:hover:border-blue-500 transition-all group relative overflow-hidden"
                    >
                        <div className="absolute top-0 left-0 w-1 h-full bg-slate-200 dark:bg-slate-700 group-hover:bg-blue-500 transition-colors"></div>

                        <button 
                            onClick={(e) => deleteTicket(ticket.id, e)}
                            className="absolute top-2 right-2 p-1 rounded-md text-slate-300 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 opacity-0 group-hover:opacity-100 transition-all"
                        >
                            <X size={16} />
                        </button>

                        <div className="flex justify-between items-start mb-2 pr-6 pl-2">
                            <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
                                    {ticket.device.toLowerCase().includes('phone') ? <Smartphone size={16}/> : 
                                    ticket.device.toLowerCase().includes('mac') || ticket.device.toLowerCase().includes('dell') ? <Laptop size={16}/> : <Tablet size={16}/>}
                                    <span className="text-[10px] font-mono font-bold bg-slate-100 dark:bg-slate-700 px-1.5 py-0.5 rounded tracking-wide">{ticket.id}</span>
                            </div>
                            {ticket.priority === 'high' && (
                                <span className="relative flex h-2.5 w-2.5" title="High Priority">
                                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500"></span>
                                </span>
                            )}
                        </div>
                        
                        <h3 className="font-bold text-slate-900 dark:text-white mb-2 text-sm pl-2">{ticket.device}</h3>
                        
                        <div className="mb-3 pl-2">
                            <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-semibold
                                ${ticket.priority === 'high' ? 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 border border-red-100 dark:border-red-900/30' : 
                                ticket.priority === 'medium' ? 'bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400 border border-orange-100 dark:border-orange-900/30' :
                                'bg-slate-100 dark:bg-slate-700/50 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-600'}`}>
                                {ticket.issue}
                            </span>
                        </div>

                        <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-700 pl-2">
                            <div className="flex items-center gap-1.5 text-xs font-medium text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-900/50 px-2 py-1 rounded-md">
                                <Clock size={12} />
                                <span>{ticket.deadline}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="w-6 h-6 rounded-full bg-gradient-to-br from-slate-200 to-slate-300 dark:from-slate-700 dark:to-slate-600 flex items-center justify-center text-[10px] font-bold text-slate-600 dark:text-slate-300 ring-2 ring-white dark:ring-slate-800">
                                    {ticket.customerName.charAt(0)}
                                </div>
                                {status !== 'completed' && (
                                    <button 
                                        onClick={() => moveTicket(ticket.id, status)}
                                        className="p-1.5 rounded-full bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 hover:bg-blue-500 hover:text-white dark:hover:bg-blue-500 transition-all shadow-sm"
                                        title="Chuyển tiếp"
                                    >
                                        <ArrowRight size={14} />
                                    </button>
                                )}
                            </div>
                        </div>
                    </motion.div>
                    ))}
                    </AnimatePresence>
                    {status === 'pending' && (
                        <button 
                            onClick={() => setIsAddModalOpen(true)}
                            className="w-full py-3 rounded-xl border-2 border-dashed border-slate-300 dark:border-slate-600 text-slate-400 dark:text-slate-500 hover:bg-white/50 dark:hover:bg-slate-700/50 hover:text-blue-600 hover:border-blue-400 transition-all flex items-center justify-center gap-2 text-sm font-semibold"
                        >
                            <Plus size={18} /> Thêm việc mới
                        </button>
                    )}
                </div>
            </div>
        );
    }

  return (
    <div className="h-[calc(100vh-8rem)] flex flex-col">
       <div className="flex justify-between items-center mb-6">
            <div>
                <h1 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">Công việc kỹ thuật</h1>
                <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Quản lý tiến độ sửa chữa thiết bị</p>
            </div>
            <div className="flex gap-3">
                 <div className="relative">
                    <select 
                        className="appearance-none bg-white/60 dark:bg-slate-800/60 backdrop-blur border border-slate-200 dark:border-slate-700 rounded-xl text-sm px-4 py-2.5 pr-8 outline-none dark:text-white font-medium shadow-sm hover:border-blue-400 transition-colors cursor-pointer"
                        value={filterTech}
                        onChange={(e) => setFilterTech(e.target.value)}
                    >
                        <option value="All">Tất cả KTV</option>
                        <option value="A">Nguyễn Văn A</option>
                        <option value="B">Trần Kỹ Thuật</option>
                    </select>
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500">
                        <svg width="10" height="6" viewBox="0 0 10 6" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M1 1L5 5L9 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                    </div>
                 </div>
                 <button 
                    onClick={() => setIsAddModalOpen(true)}
                    className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-5 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 shadow-lg shadow-blue-500/20 transition-all active:scale-95"
                >
                    <Plus size={18} /> Thêm việc
                 </button>
            </div>
       </div>

       <div className="flex-1 overflow-x-auto pb-4 scrollbar-hide">
           <div className="flex h-full gap-6 min-w-[1024px] px-1">
               <Column title="Chờ tiếp nhận" status="pending" color="bg-slate-400" borderColor="border-slate-400" />
               <Column title="Đang xử lý" status="in-progress" color="bg-blue-500" borderColor="border-blue-500" />
               <Column title="Hoàn thành / KCS" status="completed" color="bg-emerald-500" borderColor="border-emerald-500" />
           </div>
       </div>

       {/* Add Ticket Modal */}
       <AnimatePresence>
       {isAddModalOpen && (
           <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
               <motion.div 
                    initial={{ opacity: 0, scale: 0.9, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9, y: 20 }}
                    className="bg-white dark:bg-slate-800 rounded-2xl w-full max-w-md p-6 shadow-2xl border border-white/10"
                >
                   <div className="flex justify-between items-center mb-6">
                       <h3 className="text-xl font-bold text-slate-900 dark:text-white">Thêm phiếu sửa chữa</h3>
                       <button onClick={() => setIsAddModalOpen(false)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full transition-colors text-slate-400 hover:text-slate-600"><X size={20}/></button>
                   </div>
                   <form onSubmit={handleAddTicket} className="space-y-4">
                       <div>
                           <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1.5">Tên thiết bị</label>
                           <input 
                                required
                                type="text" 
                                className="w-full rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700/50 p-3 text-sm dark:text-white focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 outline-none transition-all"
                                placeholder="VD: iPhone 14 Pro"
                                value={newTicket.device}
                                onChange={e => setNewTicket({...newTicket, device: e.target.value})}
                           />
                       </div>
                       <div>
                           <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1.5">Khách hàng</label>
                           <input 
                                required
                                type="text" 
                                className="w-full rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700/50 p-3 text-sm dark:text-white focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 outline-none transition-all"
                                placeholder="Tên khách hàng"
                                value={newTicket.customerName}
                                onChange={e => setNewTicket({...newTicket, customerName: e.target.value})}
                           />
                       </div>
                       <div>
                           <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1.5">Lỗi gặp phải</label>
                           <input 
                                required
                                type="text" 
                                className="w-full rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700/50 p-3 text-sm dark:text-white focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 outline-none transition-all"
                                placeholder="VD: Mất nguồn"
                                value={newTicket.issue}
                                onChange={e => setNewTicket({...newTicket, issue: e.target.value})}
                           />
                       </div>
                       <div>
                           <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1.5">Mức độ ưu tiên</label>
                           <div className="flex gap-2">
                               {PRIORITIES.map(p => (
                                   <button
                                        key={p}
                                        type="button"
                                        onClick={() => setNewTicket({...newTicket, priority: p})}
                                        className={`px-4 py-2 rounded-lg text-sm font-semibold capitalize border transition-all ${
                                            newTicket.priority === p 
                                            ? 'bg-blue-50 border-blue-500 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400 shadow-sm transform scale-105' 
                                            : 'border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700/50'
                                        }`}
                                   >
                                       {p}
                                   </button>
                               ))}
                           </div>
                       </div>
                       <button type="submit" className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold py-3 rounded-xl mt-4 shadow-lg shadow-blue-500/30 transition-all active:scale-95">
                           Tạo phiếu
                       </button>
                   </form>
               </motion.div>
           </div>
       )}
       </AnimatePresence>
    </div>
  );
};