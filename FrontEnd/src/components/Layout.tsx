import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { MENU_ITEMS } from '../constants';
import { useNavigate, useLocation } from 'react-router-dom';
import { LogOut, Moon, Sun, Menu, X, ChevronRight, Zap } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isDarkMode, setIsDarkMode] = useState(false);

  const toggleDarkMode = () => {
    setIsDarkMode(!isDarkMode);
    document.documentElement.classList.toggle('dark');
  };

  if (!user) return <>{children}</>;

  const filteredMenu = MENU_ITEMS.filter(item => item.roles.includes(user.role));

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <div className={`min-h-screen relative flex font-sans transition-colors duration-200 ${isDarkMode ? 'dark' : ''} overflow-hidden`}>
      
      {/* Animated Background Blobs */}
      <div className="blob-cont bg-slate-50 dark:bg-slate-900 transition-colors duration-500">
        <div className="blob bg-blue-400 w-96 h-96 rounded-full top-0 left-0 mix-blend-multiply dark:mix-blend-normal"></div>
        <div className="blob bg-purple-400 w-96 h-96 rounded-full top-0 right-0 animation-delay-2000 mix-blend-multiply dark:mix-blend-normal" style={{animationDelay: '2s', right: '-5rem'}}></div>
        <div className="blob bg-pink-400 w-80 h-80 rounded-full bottom-0 left-20 animation-delay-4000 mix-blend-multiply dark:mix-blend-normal" style={{animationDelay: '4s'}}></div>
      </div>

      {/* Mobile Sidebar Backdrop */}
      <AnimatePresence>
        {isSidebarOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsSidebarOpen(false)}
            className="fixed inset-0 bg-black/20 backdrop-blur-sm z-20 lg:hidden"
          />
        )}
      </AnimatePresence>

      {/* Sidebar - Glassmorphism */}
      <motion.aside 
        initial={false}
        animate={{ width: isSidebarOpen ? 260 : 0, x: isSidebarOpen ? 0 : -260 }}
        className={`fixed lg:static inset-y-0 left-0 z-30 
        bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl border-r border-white/20 dark:border-slate-700/50 shadow-2xl
        flex flex-col transition-all duration-300 overflow-hidden lg:!translate-x-0 lg:!w-64`}
      >
        <div className="h-20 flex items-center px-6">
          <div className="flex items-center gap-3 relative group cursor-pointer">
            <div className="absolute inset-0 bg-blue-500/20 rounded-xl blur-lg group-hover:bg-blue-500/40 transition-all"></div>
            <div className="relative bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl p-2 shadow-lg shadow-blue-500/30">
              <Zap className="w-6 h-6 text-white fill-white" />
            </div>
            <div>
              <h1 className="text-slate-900 dark:text-white text-xl font-bold leading-none tracking-tight">TechCare</h1>
              <p className="text-blue-600 dark:text-blue-400 text-xs font-bold uppercase tracking-wider mt-0.5">Manager</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto py-6 px-4 space-y-1.5 scrollbar-hide">
          {filteredMenu.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <button
                key={item.path}
                onClick={() => {
                  navigate(item.path);
                  if (window.innerWidth < 1024) setIsSidebarOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-300 group relative overflow-hidden ${
                  isActive 
                    ? 'text-white shadow-lg shadow-blue-500/25' 
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                {isActive && (
                    <motion.div 
                        layoutId="activeTab"
                        className="absolute inset-0 bg-gradient-to-r from-blue-600 to-indigo-600"
                        initial={false}
                        transition={{ type: "spring", stiffness: 500, damping: 30 }}
                    />
                )}
                <span className="relative z-10 flex items-center gap-3 w-full">
                    <item.icon size={20} className={`${isActive ? 'text-white' : 'group-hover:scale-110 transition-transform duration-300'}`} />
                    <span className="text-sm font-medium">{item.label}</span>
                    {isActive && <ChevronRight size={16} className="ml-auto opacity-70" />}
                </span>
              </button>
            );
          })}
        </nav>

        <div className="p-4 mx-4 mb-4 rounded-2xl bg-gradient-to-br from-slate-100 to-white dark:from-slate-800 dark:to-slate-900 border border-white/50 dark:border-slate-700/50 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="relative">
                <img src={user.avatar} alt={user.name} className="w-10 h-10 rounded-full border-2 border-white dark:border-slate-700 shadow-sm" />
                <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 border-2 border-white dark:border-slate-800 rounded-full"></span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-slate-900 dark:text-white truncate">{user.name}</p>
              <p className="text-xs text-slate-500 dark:text-slate-400 truncate capitalize font-medium">{user.role}</p>
            </div>
            <button 
                onClick={handleLogout} 
                className="p-2 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all"
                title="Đăng xuất"
            >
              <LogOut size={18} />
            </button>
          </div>
        </div>
      </motion.aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative z-10">
        <header className="h-20 flex items-center justify-between px-6 sticky top-0 z-20 transition-all duration-300">
            {/* Glass Header Background that appears on scroll could be added here, keeping simple for now */}
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="lg:hidden p-2 rounded-xl bg-white/50 dark:bg-slate-800/50 backdrop-blur-md border border-white/20 dark:border-slate-700 hover:bg-white/80 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-all"
            >
              {isSidebarOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
            <div className="hidden sm:block">
                <h2 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-slate-600 dark:from-white dark:to-slate-400">
                {filteredMenu.find(m => m.path === location.pathname)?.label || 'Dashboard'}
                </h2>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <button 
              onClick={toggleDarkMode}
              className="p-2.5 rounded-full bg-white/40 dark:bg-slate-800/40 backdrop-blur-md border border-white/20 dark:border-slate-700 text-slate-600 dark:text-yellow-400 hover:scale-110 transition-transform shadow-sm"
            >
              {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
            </button>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 md:p-8 scroll-smooth">
           <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 20, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.98 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
              className="max-w-7xl mx-auto"
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
};