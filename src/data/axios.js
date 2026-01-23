import axios from "axios";
import { logout } from "./modules/auth-module";

// Create an Axios instance
const api = axios.create({
  baseURL: import.meta.env.VITE_APP_BASE_URL,
});

// Request interceptor → attach token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor → auto logout on 401
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    console.log("error: ", error.response);
    if (error.response && error.response.status === 401 && !error.config.url.endsWith("/logout")) {
      await logout();
    }
    return Promise.reject(error);
  }
);

// Helper to normalize Axios errors
export const resolveAxiosError = (error) => {
  if (!error) return { status: 500, message: "Unknown error occurred" };

  if (error.response) {
    return {
      status: error.response.status || 500,
      message: error.response.data?.data?.message || error.response.data?.message || "Request failed with server error",
      data: error.response.data || null,
    };
  }

  if (error.request) {
    return {
      status: 503,
      message: `No response received from server (${error})`,
      data: null,
    };
  }

  return {
    status: 500,
    message: error.message || "Axios request error",
    data: null,
  };
};

export default api;