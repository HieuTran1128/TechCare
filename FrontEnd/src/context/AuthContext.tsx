import axios from 'axios';
import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api';

export interface User {
  id: string;
  email: string;
  fullName: string;
  role: string;
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

  const logout = useCallback(() => {
    setUser(null);
    localStorage.removeItem('techcare_user');
    axios.post(`${API_BASE}/auth/logout`, {}, { withCredentials: true }).catch(() => undefined);
  }, []);

  const fetchUserProfile = useCallback(async () => {
    try {
      setIsLoading(true);
      const res = await axios.get(`${API_BASE}/users/me`, { withCredentials: true });
      const freshUser = res.data as User;
      setUser(freshUser);
      localStorage.setItem('techcare_user', JSON.stringify(freshUser));
    } catch (err: any) {
      if (err.response?.status === 401 || err.response?.status === 403) {
        logout();
      }
    } finally {
      setIsLoading(false);
    }
  }, [logout]);

  useEffect(() => {
    const stored = localStorage.getItem('techcare_user');
    if (!stored) {
      setIsLoading(false);
      return;
    }

    try {
      setUser(JSON.parse(stored));
    } catch {
      localStorage.removeItem('techcare_user');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const login = (userData: User) => {
    setUser(userData);
    localStorage.setItem('techcare_user', JSON.stringify(userData));
  };

  const updateAvatar = async (file: File) => {
    const formData = new FormData();
    formData.append('avatar', file);

    const res = await axios.post(`${API_BASE}/users/avatar`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      withCredentials: true,
    });

    const newAvatar = res.data.avatar;
    setUser((prev) => {
      if (!prev) return prev;
      const updated = { ...prev, avatar: newAvatar };
      localStorage.setItem('techcare_user', JSON.stringify(updated));
      return updated;
    });
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout, updateAvatar, fetchUserProfile }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
