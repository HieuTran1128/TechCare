import axios from "axios";
import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import toast from "react-hot-toast";

const API_BASE =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:3000/api";

interface User {
  id: string;
  email: string;
  fullName: string;
  role: string;
  token?: string;
  avatar?: string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (userData: User) => void;
  logout: () => void;
  updateAvatar: (file: File) => Promise<void>;
  fetchUserProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const setAuthHeader = (token?: string) => {
    if (token) {
      axios.defaults.headers.common.Authorization = `Bearer ${token}`;
    } else {
      delete axios.defaults.headers.common.Authorization;
    }
  };

  useEffect(() => {
    const loadUser = () => {
      try {
        const stored = localStorage.getItem("techcare_user");
        if (stored) {
          const parsed = JSON.parse(stored) as User;
          setUser(parsed);
          setAuthHeader(parsed.token);
        }
      } catch (err) {
        console.error("Failed to parse stored user:", err);
        localStorage.removeItem("techcare_user");
      } finally {
        setIsLoading(false);
      }
    };

    loadUser();
  }, []);

  const fetchUserProfile = async () => {
    try {
      setIsLoading(true);
      const res = await axios.get(`${API_BASE}/users/me`, {
        withCredentials: true,
      });

      const freshUser = res.data as User;
      const existingToken =
        user?.token ||
        (JSON.parse(localStorage.getItem("techcare_user") || "{}") as User)
          ?.token;
      const mergedUser = { ...freshUser, token: existingToken };

      setUser(mergedUser);
      setAuthHeader(existingToken);

      localStorage.setItem("techcare_user", JSON.stringify(mergedUser));

      console.log(
        "[FETCH USER] Đã cập nhật user từ server:",
        freshUser.fullName,
      );
    } catch (err: any) {
      console.error("[FETCH USER] Lỗi:", err);
      if (err.response?.status === 401 || err.response?.status === 403) {
        logout();
        toast.error("Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  //   const login = (userData: User) => {
  //     console.log('[LOGIN] User nhận từ API:', userData.avatar);
  //     setUser(userData);
  //     localStorage.setItem('techcare_user', JSON.stringify(userData));
  //     // Sau login, fetch lại để chắc chắn có avatar/fullName mới nhất
  // console.log('[LOGIN] Đã lưu user vào localStorage:', userData.avatar);
  //   };

  const logout = () => {
    setUser(null);
    setAuthHeader();
    localStorage.removeItem("techcare_user");
    // Nếu backend có endpoint logout để clear cookie thì gọi thêm
    axios.post(`${API_BASE}/auth/logout`, {}, { withCredentials: true });
  };

  const updateAvatar = async (file: File) => {
    if (!file) return;

    const formData = new FormData();
    formData.append("avatar", file);

    try {
      const res = await axios.post(`${API_BASE}/users/avatar`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
        withCredentials: true,
      });

      const newAvatarUrl = res.data.avatar;

      // Cập nhật state
      setUser((prev) => {
        const updatedUser = prev ? { ...prev, avatar: newAvatarUrl } : null;

        // Lưu localStorage NGAY SAU KHI có updatedUser (trong callback setUser)
        if (updatedUser) {
          localStorage.setItem("techcare_user", JSON.stringify(updatedUser));
          console.log(
            "[AVATAR] Đã lưu user vào localStorage:",
            updatedUser.avatar,
          );
        }

        return updatedUser;
      });

      toast.success("Avatar updated successfully!");
    } catch (err: any) {
      console.error("Update avatar failed:", err);
      toast.error(err.response?.data?.message || "Failed to update avatar");
    }
  };
  const login = (userData: User) => {
    setUser(userData);
    setAuthHeader(userData.token);
    localStorage.setItem("techcare_user", JSON.stringify(userData));
    fetchUserProfile(); // ← gọi thêm để lấy avatar từ DB (nếu login chỉ trả user cơ bản)
  };
  return (
    <AuthContext.Provider
      value={{ user, isLoading, login, logout, updateAvatar, fetchUserProfile }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
