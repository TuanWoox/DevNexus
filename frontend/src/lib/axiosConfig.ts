import axios, { AxiosResponse } from "axios";
import { toast } from "sonner";
import { ReturnResult } from "../types/common/return-result";

// Định nghĩa instance mặc định cho dự án
export const api = axios.create({
  // Sử dụng biến môi trường cho URL, nếu không thì dùng mặc định
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api',
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

// Interceptor cho các Gửi yêu cầu (Request): Chạy trước khi gửi API
api.interceptors.request.use(
  (config) => {
    // Lấy token từ nơi bạn sẽ lưu (ví dụ local storage, cookie...)
    // Trong Next.js thì cần check môi trường client (window)
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('token');
      if (token && config.headers) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor cho Phản hồi (Response): Chạy khi có response từ server
api.interceptors.response.use(
  function onFulfilled<T>(response: AxiosResponse<ReturnResult<T>>) {
    if (response.data.message) {
      toast.error(response.data.message);
    }
    return response;
  },
  function onRejected(error) {
    // Any status codes that falls outside the range of 2xx cause this function to trigger
    // Do something with response error
    return Promise.reject(error);
  }
);
