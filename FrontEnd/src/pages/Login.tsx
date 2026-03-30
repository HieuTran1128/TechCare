import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate, Link } from "react-router-dom";
import { Wrench, Mail, Lock, ArrowRight, Loader2, Search, Shield, Package, ClipboardList } from "lucide-react";
import { motion } from "framer-motion";
import { authService } from "../services";

const DEMO_ACCOUNTS = [
  {
    role: "Quản lý",
    email: "vunthde180740@fpt.edu.vn",
    password: "hoangvu",
    icon: Shield,
    color: "text-blue-600",
    bg: "bg-blue-100 dark:bg-blue-900/30",
  },
  {
    role: "Lễ tân",
    email: "khongten1212004@gmail.com",
    password: "hoangvu",
    icon: ClipboardList,
    color: "text-purple-600",
    bg: "bg-purple-100 dark:bg-purple-900/30",
  },
  {
    role: "Kỹ thuật",
    email: "vuker1212004@gmail.com",
    password: "hoangvu",
    icon: Wrench,
    color: "text-orange-600",
    bg: "bg-orange-100 dark:bg-orange-900/30",
  },
  {
    role: "Kho",
    email: "haitmde180679@fpt.edu.vn",
    password: "hoangvu",
    icon: Package,
    color: "text-emerald-600",
    bg: "bg-emerald-100 dark:bg-emerald-900/30",
  },
];

export const Login: React.FC = () => {
  const { login } = useAuth(); // Context có hàm login để cập nhật state global
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError("");

    try {
      const response = await authService.login(email, password);
      const { success, token, user } = response;

      if (success) {
        localStorage.setItem("token", token);
        login({ id: user.id, email: user.email, fullName: user.fullName, role: user.role });

        const role = user.role?.toLowerCase();
        switch (role) {
          case "manager": navigate("/admin"); break;
          case "frontdesk": navigate("/frontdesk"); break;
          case "technician": navigate("/technician"); break;
          case "storekeeper": navigate("/inventory"); break;
          default: navigate("/"); break;
        }
      }
    } catch (err: any) {
      if (err.response?.status === 404) setError("Email không tồn tại.");
      else if (err.response?.status === 401) setError("Mật khẩu không đúng.");
      else if (err.response?.status === 403) setError("Tài khoản chưa được kích hoạt hoặc bị khóa.");
      else setError(err.response?.data?.message || "Đăng nhập thất bại. Vui lòng thử lại.");
    } finally {
      setIsSubmitting(false);
    }
  };

  /** Điền sẵn email và mật khẩu từ tài khoản demo vào form. */
  const fillCredential = (demoEmail: string, demoPassword: string) => {
    setEmail(demoEmail);
    setPassword(demoPassword);
    setError("");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900 p-4 transition-colors duration-300 relative overflow-hidden">
      <div className="absolute inset-0 w-full h-full">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-blue-500/20 blur-[100px] animate-float"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-purple-500/20 blur-[100px] animate-float-delayed"></div>
      </div>

      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="w-full max-w-4xl grid grid-cols-1 md:grid-cols-2 gap-8 bg-white/70 dark:bg-slate-800/70 backdrop-blur-2xl rounded-3xl shadow-2xl border border-white/40 dark:border-slate-700/50 p-8 relative z-10"
      >
        <div className="flex flex-col justify-center p-2">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/30 transform -rotate-3">
              <Wrench className="text-white w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-700 to-indigo-600 dark:from-white dark:to-blue-300">
                TechCare
              </h1>
              <p className="text-xs font-bold tracking-widest text-slate-500 dark:text-slate-400 uppercase">
                Service SaaS
              </p>
            </div>
          </div>

          <div className="mb-8">
            <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">
              Xin chào!
            </h2>
            <p className="text-slate-500 dark:text-slate-400">
              Đăng nhập để quản lý cửa hàng của bạn.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 ml-1">
                Email
              </label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-slate-400" />
                </div>
                <input
                  required
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="block w-full pl-10 pr-3 py-3 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50/50 dark:bg-slate-900/50 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                  placeholder="name@techcare.vn"
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center ml-1">
                <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                  Mật khẩu
                </label>
                <Link
                  to="/forgot-password"
                  className="text-xs font-bold text-blue-600 hover:text-blue-700 dark:text-blue-400"
                >
                  Quên mật khẩu?
                </Link>
              </div>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-slate-400" />
                </div>
                <input
                  required
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full pl-10 pr-3 py-3 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50/50 dark:bg-slate-900/50 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                  placeholder="••••••••"
                />
              </div>
            </div>

            {error && (
              <p className="text-red-500 text-sm text-center bg-red-50 dark:bg-red-900/20 py-2.5 rounded-xl font-medium">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full h-12 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold rounded-xl shadow-lg shadow-blue-500/30 hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2 group disabled:opacity-70"
            >
              {isSubmitting ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  Đăng nhập{" "}
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </form>
        </div>

        <div className="flex flex-col justify-center space-y-4 border-t md:border-t-0 md:border-l border-slate-200/60 dark:border-slate-700/60 md:pl-8 pt-6 md:pt-0">
          <h3 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2">
            Tài khoản Demo
          </h3>
          <div className="grid grid-cols-1 gap-2">
            {DEMO_ACCOUNTS.map((acc) => (
              <button
                key={acc.email}
                onClick={() => fillCredential(acc.email, acc.password)}
                className="flex items-center gap-3 p-3 rounded-2xl bg-white/50 dark:bg-slate-800/50 hover:bg-white dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 transition-all text-left group"
              >
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center ${acc.bg} ${acc.color} group-hover:scale-110 transition-transform`}
                >
                  <acc.icon size={18} />
                </div>
                <div>
                  <p className="font-bold text-slate-900 dark:text-white text-xs">
                    {acc.role}
                  </p>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">
                    {acc.email}
                  </p>
                </div>
              </button>
            ))}
          </div>

          <div className="pt-4 border-t border-slate-200/60 dark:border-slate-700/60">
            <div
              onClick={() => navigate("/tracking")}
              className="cursor-pointer group flex items-center gap-3 p-3 rounded-2xl bg-gradient-to-r from-slate-50 to-white dark:from-slate-800 dark:to-slate-900 border border-dashed border-slate-300 dark:border-slate-600 transition-all"
            >
              <div className="w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-all">
                <Search size={18} />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-900 dark:text-white">
                  Tra cứu đơn sửa chữa
                </p>
                <p className="text-[10px] text-slate-500">
                  Dành cho khách hàng
                </p>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
