import React, { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { MENU_ITEMS } from '../constants';
import { useNavigate, useLocation } from 'react-router-dom';
import { LogOut, Menu, Gem, ShieldCheck, Briefcase, User } from 'lucide-react';
import { motion } from 'framer-motion';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api';

const roleLabel: Record<string, string> = {
  manager: 'Admin / Manager',
  technician: 'Staff · Kỹ thuật',
  storekeeper: 'Staff · Kho',
  frontdesk: 'Staff · Lễ tân',
};

const roleIcon: Record<string, React.ReactNode> = {
  manager: <ShieldCheck size={14} />,
  technician: <Briefcase size={14} />,
  storekeeper: <Briefcase size={14} />,
  frontdesk: <User size={14} />,
};

export const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [open, setOpen] = useState(true);
  const [openComplaints, setOpenComplaints] = useState(0);

  useEffect(() => {
    if (user?.role !== 'manager') return;
    axios.get(`${API_BASE}/complaints/stats`, { withCredentials: true })
      .then((res) => setOpenComplaints(res.data.open || 0))
      .catch(() => {});
  }, [user, location.pathname]);

  const filteredMenu = useMemo(() => {
    if (!user) return [];
    return MENU_ITEMS.filter((item) => item.roles.includes(user.role as any));
  }, [user]);

  if (!user) return <>{children}</>;

  return (
    <div className="min-h-screen flex bg-[radial-gradient(circle_at_top_left,_#eef2ff_0%,_#f8fafc_35%,_#f8fafc_100%)] text-slate-900">
      <aside
        className={`${open ? 'w-72' : 'w-0'} overflow-hidden transition-all duration-300 border-r border-slate-200/80 bg-white/85 backdrop-blur-2xl shadow-[0_8px_30px_rgba(2,6,23,.08)]`}
      >
        <div className="h-20 px-5 border-b border-slate-200/80 flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-indigo-600 via-violet-600 to-fuchsia-600 text-white grid place-items-center shadow-lg">
            <Gem size={20} />
          </div>
          <div>
            <h1 className="text-xl font-extrabold tracking-tight">TechCare OS</h1>
          </div>
        </div>

        <nav className="p-4 space-y-2">
          {filteredMenu.map((item) => {
            const active = location.pathname === item.path;
            const Icon = item.icon;
            return (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className={`group w-full text-left px-4 py-3 rounded-xl text-sm font-semibold transition flex items-center gap-3 ${
                  active
                    ? 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-md'
                    : 'text-slate-700 hover:bg-slate-100/80'
                }`}
              >
                <Icon size={16} className={active ? 'text-white' : 'text-slate-500 group-hover:text-slate-700'} />
                <span>{item.label}</span>
                {item.path === '/complaints' && openComplaints > 0 && (
                  <span className={`ml-auto text-xs font-bold px-2 py-0.5 rounded-full ${active ? 'bg-white/25 text-white' : 'bg-rose-500 text-white'}`}>
                    {openComplaints}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </aside>

      <div className="flex-1 min-w-0">
        <header className="h-16 px-5 border-b border-slate-200/70 bg-white/80 backdrop-blur-xl flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => setOpen((o) => !o)} className="p-2 rounded-lg hover:bg-slate-100 transition">
              <Menu size={18} />
            </button>
            <div>
              <h2 className="text-lg font-semibold leading-none">
                {filteredMenu.find((m) => m.path === location.pathname)?.label || 'Dashboard'}
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <motion.div
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full border border-slate-200 bg-white"
            >
              {roleIcon[user.role]}
              <span className="text-xs font-semibold text-slate-700">{roleLabel[user.role] || user.role}</span>
            </motion.div>

            <div className="text-right">
              <p className="text-sm font-semibold">{user.fullName}</p>
              <p className="text-xs text-slate-500 uppercase">{user.role}</p>
            </div>
            <button
              onClick={() => {
                logout();
                navigate('/');
              }}
              className="p-2 rounded-lg text-red-500 hover:bg-red-50 transition"
            >
              <LogOut size={18} />
            </button>
          </div>
        </header>

        <main className="p-6">{children}</main>
      </div>
    </div>
  );
};