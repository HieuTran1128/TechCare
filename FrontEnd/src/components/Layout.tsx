import React, { useMemo, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { MENU_ITEMS } from '../constants';
import { useNavigate, useLocation } from 'react-router-dom';
import { LogOut, Menu, Gem } from 'lucide-react';

export const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [open, setOpen] = useState(true);

  const filteredMenu = useMemo(() => {
    if (!user) return [];
    return MENU_ITEMS.filter((item) => item.roles.includes(user.role as any));
  }, [user]);

  if (!user) return <>{children}</>;

  return (
    <div className="min-h-screen flex bg-[#f3f5fb] text-slate-900">
      <aside className={`${open ? 'w-72' : 'w-0'} overflow-hidden transition-all border-r border-slate-200 bg-white/85 backdrop-blur-xl shadow-xl`}>
        <div className="h-20 px-5 border-b border-slate-200 flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-indigo-600 to-violet-600 text-white grid place-items-center shadow-lg">
            <Gem size={20} />
          </div>
          <div>
            <h1 className="text-xl font-bold luxury-title">TechCare</h1>
            <p className="text-[11px] uppercase tracking-widest text-slate-500">Service Workflow</p>
          </div>
        </div>

        <nav className="p-4 space-y-2">
          {filteredMenu.map((item) => {
            const active = location.pathname === item.path;
            return (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className={`w-full text-left px-4 py-3 rounded-xl text-sm font-semibold transition ${
                  active
                    ? 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-md'
                    : 'text-slate-700 hover:bg-slate-100'
                }`}
              >
                {item.label}
              </button>
            );
          })}
        </nav>
      </aside>

      <div className="flex-1 min-w-0">
        <header className="h-16 px-5 border-b border-slate-200 bg-white/85 backdrop-blur-xl flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => setOpen((o) => !o)} className="p-2 rounded-lg hover:bg-slate-100">
              <Menu size={18} />
            </button>
            <h2 className="text-lg font-semibold">
              {filteredMenu.find((m) => m.path === location.pathname)?.label || 'Dashboard'}
            </h2>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-right">
              <p className="text-sm font-semibold">{user.fullName}</p>
              <p className="text-xs text-slate-500 uppercase">{user.role}</p>
            </div>
            <button
              onClick={() => {
                logout();
                navigate('/');
              }}
              className="p-2 rounded-lg text-red-500 hover:bg-red-50"
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
