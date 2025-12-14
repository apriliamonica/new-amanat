import axios from "axios";
import { getToken, clearAuth } from "../utils/helpers";

const api = axios.create({
  baseURL: "http://localhost:5001/api",
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor to add token
api.interceptors.request.use(
  (config) => {
    const token = getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      clearAuth();
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  login: (data) => api.post("/auth/login", data),
  getMe: () => api.get("/auth/me"),
  logout: () => api.post("/auth/logout"),
};

// User API
export const userAPI = {
  getAll: () => api.get("/users"),
  getById: (id) => api.get(`/users/${id}`),
  getByRole: (role) => api.get(`/users/by-role/${role}`),
  create: (data) => api.post("/users", data),
  update: (id, data) => api.put(`/users/${id}`, data),
  delete: (id) => api.delete(`/users/${id}`),
};

// Surat Masuk API
export const suratMasukAPI = {
  exportExcel: () => api.get("/surat-masuk/export", { responseType: "blob" }),
  getAll: (params) => api.get("/surat-masuk", { params }),
  getById: (id) => api.get(`/surat-masuk/${id}`),
  create: (data) =>
    api.post("/surat-masuk", data, {
      headers: { "Content-Type": "multipart/form-data" },
    }),
  update: (id, data) =>
    api.put(`/surat-masuk/${id}`, data, {
      headers: { "Content-Type": "multipart/form-data" },
    }),
  delete: (id) => api.delete(`/surat-masuk/${id}`),
  markAsRead: (id) => api.put(`/surat-masuk/${id}/read`),
};

// Surat Keluar API
export const suratKeluarAPI = {
  exportExcel: () => api.get("/surat-keluar/export", { responseType: "blob" }),
  getAll: () => api.get("/surat-keluar"),
  getById: (id) => api.get(`/surat-keluar/${id}`),
  create: (formData) =>
    api.post("/surat-keluar", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    }),
  update: (id, formData) =>
    api.put(`/surat-keluar/${id}`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    }),
  validate: (id, data) => api.put(`/surat-keluar/${id}/validasi`, data),
  sign: (id, data) => api.put(`/surat-keluar/${id}/tanda-tangan`, data),
  send: (id, data) => api.put(`/surat-keluar/${id}/kirim`, data),
  delete: (id) => api.delete(`/surat-keluar/${id}`),
};

// Disposisi API
export const disposisiAPI = {
  getMy: () => api.get("/disposisi"),
  getBySurat: (type, suratId) => api.get(`/disposisi/surat/${type}/${suratId}`),
  create: (data) => api.post("/disposisi", data),
  update: (id, data) => api.put(`/disposisi/${id}`, data),
  complete: (id, data) => api.put(`/disposisi/${id}/selesai`, data),
};

// Lampiran API
export const lampiranAPI = {
  getBySurat: (type, suratId) => api.get(`/lampiran/surat/${type}/${suratId}`),
  upload: (formData) =>
    api.post("/lampiran", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    }),
  delete: (id) => api.delete(`/lampiran/${id}`),
};

// Dashboard API
export const dashboardAPI = {
  getStats: () => api.get("/dashboard/stats"),
  getRecent: () => api.get("/dashboard/recent"),
  getMonthly: () => api.get("/dashboard/monthly"),
};

// Jenis Surat API
export const jenisSuratAPI = {
  getAll: () => api.get("/jenis-surat"),
  create: (data) => api.post("/jenis-surat", data),
  update: (id, data) => api.put(`/jenis-surat/${id}`, data),
  delete: (id) => api.delete(`/jenis-surat/${id}`),
};

// Kode Area API
export const kodeAreaAPI = {
  getAll: () => api.get("/kode-area"),
  create: (data) => api.post("/kode-area", data),
  update: (id, data) => api.put(`/kode-area/${id}`, data),
  delete: (id) => api.delete(`/kode-area/${id}`),
};

// Kode Bagian API
export const kodeBagianAPI = {
  getAll: () => api.get("/kode-bagian"),
};

export default api;
