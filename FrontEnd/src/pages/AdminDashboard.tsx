import React, { useState, useRef,  } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { TrendingUp, Wrench, CheckCircle2, DollarSign, ArrowRight, MoreHorizontal } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

const DATA_WEEK = [
  { name: 'T2', value: 4000 },
  { name: 'T3', value: 8000 },
  { name: 'T4', value: 10000 },
  { name: 'T5', value: 7000 },
  { name: 'T6', value: 12500 },
  { name: 'T7', value: 9000 },
  { name: 'CN', value: 14000 },
];

const DATA_MONTH = [
    { name: 'W1', value: 24000 },
    { name: 'W2', value: 38000 },
    { name: 'W3', value: 32000 },
    { name: 'W4', value: 45000 },
];

// Spotlight Card Component
const SpotlightCard = ({ children, className = "" }: { children: React.ReactNode, className?: string }) => {
    const divRef = useRef<HTMLDivElement>(null);
    const [isFocused, setIsFocused] = useState(false);
    const [position, setPosition] = useState({ x: 0, y: 0 });
    const [opacity, setOpacity] = useState(0);
  
    const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
      if (!divRef.current) return;
  
      const div = divRef.current;
      const rect = div.getBoundingClientRect();
  
      setPosition({ x: e.clientX - rect.left, y: e.clientY - rect.top });
    };
  
    const handleFocus = () => {
      setIsFocused(true);
      setOpacity(1);
    };
  
    const handleBlur = () => {
      setIsFocused(false);
      setOpacity(0);
    };
  
    return (
      <div
        ref={divRef}
        onMouseMove={handleMouseMove}
        onMouseEnter={handleFocus}
        onMouseLeave={handleBlur}
        className={`relative overflow-hidden rounded-2xl border border-white/20 dark:border-slate-700 bg-white/60 dark:bg-slate-800/40 backdrop-blur-xl shadow-lg transition-all duration-300 hover:shadow-2xl hover:-translate-y-1 ${className}`}
      >
        <div
          className="pointer-events-none absolute -inset-px opacity-0 transition duration-300"
          style={{
            opacity,
            background: `radial-gradient(600px circle at ${position.x}px ${position.y}px, rgba(59, 130, 246, 0.1), transparent 40%)`,
          }}
        />
        <div className="relative h-full">{children}</div>
      </div>
    );
  };

const StatCard = ({ icon: Icon, title, value, trend, trendValue, colorClass, bgClass, iconColorClass }: any) => (
  <SpotlightCard className="p-6">
    <div className="flex justify-between items-start mb-4">
      <div className={`p-3 rounded-xl ${bgClass} ${iconColorClass} shadow-inner`}>
        <Icon size={24} className="fill-current" />
      </div>
      <span className={`flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full border ${colorClass} ${bgClass} border-current/10`}>
        {trend === 'up' && <TrendingUp size={14} />}
        {trendValue}
      </span>
    </div>
    <div>
      <p className="text-sm text-slate-500 dark:text-slate-400 font-semibold mb-1">{title}</p>
      <h3 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">{value}</h3>
    </div>
  </SpotlightCard>
);

export const AdminDashboard: React.FC = () => {
  const [timeRange, setTimeRange] = useState('week');
  const navigate = useNavigate();

  const chartData = timeRange === 'week' ? DATA_WEEK : DATA_MONTH;

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const item = {
    hidden: { y: 20, opacity: 0 },
    show: { y: 0, opacity: 1 }
  };

  return (
    <motion.div 
        variants={container}
        initial="hidden"
        animate="show"
        className="space-y-8"
    >
      {/* Stats Grid */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <motion.div variants={item}>
            <StatCard 
                icon={DollarSign}
                title="Doanh thu tháng"
                value="45.200.000 ₫"
                trend="up"
                trendValue="+12%"
                colorClass="text-emerald-600 dark:text-emerald-400"
                bgClass="bg-emerald-100/50 dark:bg-emerald-500/20"
                iconColorClass="text-emerald-600 dark:text-emerald-400"
            />
        </motion.div>
        <motion.div variants={item}>
            <StatCard 
                icon={Wrench}
                title="Đơn đang sửa"
                value="18"
                trend="neutral"
                trendValue="High Load"
                colorClass="text-orange-600 dark:text-orange-400"
                bgClass="bg-orange-100/50 dark:bg-orange-500/20"
                iconColorClass="text-orange-600 dark:text-orange-400"
            />
        </motion.div>
        <motion.div variants={item}>
            <StatCard 
                icon={CheckCircle2}
                title="Tỷ lệ hoàn thành"
                value="94%"
                trend="neutral"
                trendValue="Stable"
                colorClass="text-blue-600 dark:text-blue-400"
                bgClass="bg-blue-100/50 dark:bg-blue-500/20"
                iconColorClass="text-blue-600 dark:text-blue-400"
            />
        </motion.div>
      </section>

      {/* Chart Section */}
      <motion.section variants={item} className="bg-white/60 dark:bg-slate-800/40 backdrop-blur-xl rounded-2xl border border-white/20 dark:border-slate-700 shadow-lg p-6 md:p-8 relative overflow-hidden">
        {/* Decorate Background */}
        <div className="absolute top-0 right-0 -mt-20 -mr-20 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="flex flex-wrap items-center justify-between gap-4 mb-8 relative z-10">
            <div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white">Biểu đồ doanh thu</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Theo dõi hiệu suất kinh doanh theo thời gian thực</p>
            </div>
            <div className="flex items-center gap-3 bg-white/50 dark:bg-slate-700/50 p-1 rounded-xl border border-slate-200 dark:border-slate-600 backdrop-blur-sm">
                <button 
                    onClick={() => setTimeRange('week')}
                    className={`px-4 py-1.5 text-sm font-semibold rounded-lg transition-all ${timeRange === 'week' ? 'bg-white dark:bg-slate-600 shadow text-blue-600 dark:text-blue-400' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700'}`}
                >
                    Tuần
                </button>
                <button 
                    onClick={() => setTimeRange('month')}
                    className={`px-4 py-1.5 text-sm font-semibold rounded-lg transition-all ${timeRange === 'month' ? 'bg-white dark:bg-slate-600 shadow text-blue-600 dark:text-blue-400' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700'}`}
                >
                    Tháng
                </button>
            </div>
        </div>
        
        <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                    <defs>
                        <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4}/>
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                        </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#94a3b8" strokeOpacity={0.1} />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} dy={10} />
                    <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} />
                    <Tooltip 
                        contentStyle={{ 
                            backgroundColor: 'rgba(30, 41, 59, 0.8)', 
                            backdropFilter: 'blur(8px)',
                            border: '1px solid rgba(255,255,255,0.1)', 
                            borderRadius: '12px', 
                            color: '#fff',
                            boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)'
                        }}
                        itemStyle={{ color: '#fff' }}
                        cursor={{ stroke: '#3b82f6', strokeWidth: 2 }}
                    />
                    <Area 
                        type="monotone" 
                        dataKey="value" 
                        stroke="#3b82f6" 
                        strokeWidth={4} 
                        fillOpacity={1} 
                        fill="url(#colorValue)" 
                        animationDuration={2000}
                    />
                </AreaChart>
            </ResponsiveContainer>
        </div>
      </motion.section>

      {/* Recent Activity Table Preview */}
      <motion.section variants={item} className="bg-white/60 dark:bg-slate-800/40 backdrop-blur-xl rounded-2xl border border-white/20 dark:border-slate-700 shadow-lg overflow-hidden">
        <div className="px-6 py-5 border-b border-slate-200/50 dark:border-slate-700/50 flex justify-between items-center bg-white/40 dark:bg-slate-800/40">
            <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">Hoạt động gần đây</h3>
            </div>
            <button onClick={() => navigate('/technician')} className="text-blue-600 dark:text-blue-400 text-sm font-bold hover:underline flex items-center gap-1 group">
                Xem tất cả
                <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform"/>
            </button>
        </div>
        <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
                <thead className="bg-slate-50/50 dark:bg-slate-900/20">
                    <tr>
                        <th className="px-6 py-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Mã phiếu</th>
                        <th className="px-6 py-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Khách hàng</th>
                        <th className="px-6 py-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Thiết bị</th>
                        <th className="px-6 py-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Trạng thái</th>
                        <th className="px-6 py-4"></th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
                    {[1024, 1023, 1022].map((id, idx) => (
                        <tr key={id} onClick={() => navigate('/technician')} className="cursor-pointer hover:bg-blue-50/50 dark:hover:bg-blue-900/10 transition-colors group">
                            <td className="px-6 py-4 font-bold text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">TC-{id}</td>
                            <td className="px-6 py-4 text-slate-600 dark:text-slate-300 font-medium">Nguyễn Văn {String.fromCharCode(65+idx)}</td>
                            <td className="px-6 py-4 text-slate-500 dark:text-slate-400">iPhone {13 + idx} Pro Max</td>
                            <td className="px-6 py-4">
                                <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold border ${
                                    idx === 0 ? 'bg-blue-100/50 text-blue-700 border-blue-200 dark:bg-blue-500/10 dark:text-blue-400 dark:border-blue-500/20' :
                                    idx === 1 ? 'bg-yellow-100/50 text-yellow-700 border-yellow-200 dark:bg-yellow-500/10 dark:text-yellow-400 dark:border-yellow-500/20' :
                                    'bg-green-100/50 text-green-700 border-green-200 dark:bg-green-500/10 dark:text-green-400 dark:border-green-500/20'
                                }`}>
                                    {idx === 0 ? 'Đang sửa' : idx === 1 ? 'Chờ linh kiện' : 'Hoàn thành'}
                                </span>
                            </td>
                            <td className="px-6 py-4 text-right">
                                <button className="p-1.5 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-400 transition-colors">
                                    <MoreHorizontal size={16} />
                                </button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
      </motion.section>
    </motion.div>
  );
};