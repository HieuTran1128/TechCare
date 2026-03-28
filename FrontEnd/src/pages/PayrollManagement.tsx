import React, { useState, useEffect } from "react";
import axios from "axios";
import { Search, Edit2, Save, X, DollarSign, Clock } from "lucide-react";
import toast from "react-hot-toast";

interface EmployeeSalary {
  userId: string;
  fullName: string;
  role: string;
  totalShifts: number;
  totalHours: number;
  hourlyRate: number;
  totalEarnings: number;
}

const API_BASE = "http://localhost:3000/api"; // Đảm bảo đúng với port backend của bạn

export const PayrollManagement: React.FC = () => {
  const [salaries, setSalaries] = useState<EmployeeSalary[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  // State quản lý Modal Edit
  const [editingUser, setEditingUser] = useState<EmployeeSalary | null>(null);
  const [editRate, setEditRate] = useState<number>(0);

  useEffect(() => {
    fetchSalaries();
  }, []);

  const fetchSalaries = async () => {
    setLoading(true);
    try {
      // Lấy token nếu hệ thống của bạn dùng JWT lưu ở localStorage
      const token = localStorage.getItem("token");
      const response = await axios.get(`${API_BASE}/salary`, {
        withCredentials: true, // Thêm dòng này nếu bạn dùng cookie
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      setSalaries(response.data.data);
    } catch (error: any) {
      console.error(error);
      toast.error(error.response?.data?.message || "Lỗi khi tải bảng lương");
    } finally {
      setLoading(false);
    }
  };

  const handleOpenEdit = (user: EmployeeSalary) => {
    setEditingUser(user);
    setEditRate(user.hourlyRate || 0);
  };

  const handleSaveEdit = async () => {
    if (!editingUser) return;

    try {
      const token = localStorage.getItem("token");
      // Gọi API Update hourlyRate
      await axios.put(
        `${API_BASE}/salary/${editingUser.userId}`,
        { hourlyRate: editRate },
        {
          withCredentials: true,
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        },
      );

      // Cập nhật lại UI ngay lập tức không cần load lại trang
      setSalaries((prev) =>
        prev.map((s) => {
          if (s.userId === editingUser.userId) {
            return {
              ...s,
              hourlyRate: editRate,
              totalEarnings: editRate * s.totalHours,
            };
          }
          return s;
        }),
      );

      toast.success(`Đã cập nhật lương cho ${editingUser.fullName}`);
      setEditingUser(null);
    } catch (error: any) {
      console.error(error);
      toast.error(
        error.response?.data?.message || "Có lỗi xảy ra khi cập nhật!",
      );
    }
  };

  const filteredSalaries = salaries.filter(
    (s) =>
      s.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.role?.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">
            Bảng Lương Nhân Sự
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Quản lý giờ làm và thiết lập mức lương theo giờ (1 ca = 4 giờ)
          </p>
        </div>

        <div className="relative">
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            size={18}
          />
          <input
            type="text"
            placeholder="Tìm kiếm nhân viên..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 pr-4 py-2 border border-slate-200 dark:border-slate-700 rounded-xl bg-white/50 dark:bg-slate-800/50 focus:outline-none focus:ring-2 focus:ring-indigo-500 w-full md:w-64"
          />
        </div>
      </div>

      <div className="bg-white/60 dark:bg-slate-800/40 backdrop-blur-xl rounded-2xl border border-white/20 dark:border-slate-700 shadow-lg overflow-hidden">
        {loading ? (
          <div className="text-center py-10 text-slate-500">
            Đang tải dữ liệu...
          </div>
        ) : filteredSalaries.length === 0 ? (
          <div className="text-center py-10 text-slate-500">
            Không tìm thấy dữ liệu lương.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-slate-100/50 dark:bg-slate-800/50 text-slate-600 dark:text-slate-300">
                <tr>
                  <th className="px-6 py-4 font-semibold">Nhân viên</th>
                  <th className="px-6 py-4 font-semibold">Vai trò</th>
                  <th className="px-6 py-4 font-semibold text-center">
                    Số giờ làm
                  </th>
                  <th className="px-6 py-4 font-semibold text-right">
                    Lương / Giờ (VNĐ)
                  </th>
                  <th className="px-6 py-4 font-semibold text-right">
                    Tổng nhận (VNĐ)
                  </th>
                  <th className="px-6 py-4 font-semibold text-center">
                    Thao tác
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200/60 dark:divide-slate-700/60">
                {filteredSalaries.map((s) => (
                  <tr
                    key={s.userId}
                    className="hover:bg-white/40 dark:hover:bg-slate-800/40 transition-colors"
                  >
                    <td className="px-6 py-4 font-medium text-slate-900 dark:text-slate-100">
                      {s.fullName}
                    </td>
                    <td className="px-6 py-4 text-slate-500 capitalize">
                      {s.role}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 py-1 px-3 rounded-full font-medium">
                        {s.totalHours} giờ
                      </span>
                      <div className="text-xs text-slate-400 mt-1">
                        ({s.totalShifts} ca)
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right font-medium">
                      {(s.hourlyRate || 0).toLocaleString()} ₫
                    </td>
                    <td className="px-6 py-4 text-right font-bold text-indigo-600 dark:text-indigo-400">
                      {(s.totalEarnings || 0).toLocaleString()} ₫
                    </td>
                    <td className="px-6 py-4 text-center">
                      <button
                        onClick={() => handleOpenEdit(s)}
                        className="p-2 text-slate-400 hover:text-indigo-600 bg-slate-100 hover:bg-indigo-50 rounded-lg transition-colors"
                        title="Thiết lập mức lương"
                      >
                        <Edit2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal Chỉnh sửa Lương */}
      {editingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden border border-slate-200 dark:border-slate-800">
            <div className="flex justify-between items-center p-5 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                Cập nhật mức lương
              </h3>
              <button
                onClick={() => setEditingUser(null)}
                className="text-slate-400 hover:text-slate-600 transition"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-5 space-y-4">
              <div>
                <p className="text-sm text-slate-500 mb-1">Nhân viên</p>
                <p className="font-semibold text-slate-900 dark:text-white">
                  {editingUser.fullName}{" "}
                  <span className="text-xs font-normal text-slate-400 uppercase ml-2">
                    ({editingUser.role})
                  </span>
                </p>
              </div>

              <div className="space-y-3">
                <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-xl">
                  <p className="text-sm text-blue-800 dark:text-blue-300">
                    Nhân viên này đã đăng ký{" "}
                    <strong>{editingUser.totalShifts} ca</strong> (tương đương{" "}
                    <strong>{editingUser.totalHours} giờ</strong> làm việc).
                  </p>
                </div>

                <div>
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-300 flex items-center gap-2 mb-1">
                    <DollarSign size={16} className="text-emerald-500" />
                    Mức lương theo giờ (VNĐ/Giờ)
                  </label>
                  <input
                    type="number"
                    value={editRate}
                    onChange={(e) => setEditRate(Number(e.target.value))}
                    className="w-full border border-slate-300 dark:border-slate-700 rounded-xl px-4 py-2 focus:ring-2 focus:ring-indigo-500 outline-none bg-slate-50 dark:bg-slate-800"
                  />
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center">
                <span className="text-sm text-slate-500">Tạm tính:</span>
                <span className="text-xl font-bold text-indigo-600">
                  {(editRate * editingUser.totalHours).toLocaleString()} ₫
                </span>
              </div>
            </div>

            <div className="p-4 bg-slate-50 dark:bg-slate-800/50 flex justify-end gap-3">
              <button
                onClick={() => setEditingUser(null)}
                className="px-4 py-2 text-slate-600 font-medium hover:bg-slate-200 rounded-xl transition"
              >
                Hủy
              </button>
              <button
                onClick={handleSaveEdit}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-xl flex items-center gap-2 transition shadow-md shadow-indigo-200"
              >
                <Save size={16} /> Lưu thay đổi
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
