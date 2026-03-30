// Cấu hình chung cho tất cả API calls

export const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api';

export const API_CONFIG = {
  withCredentials: true, // Gửi cookie JWT trong mọi request
};
