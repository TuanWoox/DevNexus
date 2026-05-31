import axios, { AxiosResponse, InternalAxiosRequestConfig } from "axios";
import { toast } from "sonner";
import { ReturnResult } from "../types/common/return-result";
import Cookies from "js-cookie";
import { TokenResponseDTO } from "../types/helper/token-response-dto";
import { store } from "../store/store";
import { setToken, clearToken, parseUserFromToken } from "../store/slices/auth-slice";
import type { AccountModerationStatus } from "../types/common/return-result";

declare module "axios" {
  export interface AxiosRequestConfig<D = any> {
    suppressToast?: boolean;
  }

  export interface InternalAxiosRequestConfig<D = any> {
    suppressToast?: boolean;
  }
}

// --- QUẢN LÝ TRẠNG THÁI REFRESH ---
let isRefreshing = false;
let refreshSubscribers: ((token: string) => void)[] = [];

// Hàm đưa các request bị gián đoạn vào hàng đợi
const subscribeTokenRefresh = (cb: (token: string) => void) => {
  refreshSubscribers.push(cb);
};

// Hàm gọi lại tất cả request trong hàng đợi sau khi có token mới
const onRerefreshed = (token: string) => {
  refreshSubscribers.map((cb) => cb(token));
  refreshSubscribers = [];
};

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL_HTTPS || process.env.NEXT_PUBLIC_API_URL_HTTP,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

const clearAuthState = () => {
  Cookies.remove('accessToken');
  Cookies.remove('refreshToken');
  store.dispatch(clearToken());
};

const redirectToSuspendedPage = (moderationStatus?: AccountModerationStatus | null) => {
  clearAuthState();
  refreshSubscribers = [];
  isRefreshing = false;

  if (typeof window === 'undefined') return;

  if (moderationStatus) {
    window.sessionStorage.setItem('accountModerationStatus', JSON.stringify(moderationStatus));
  }

  if (window.location.pathname !== '/account-suspended') {
    window.location.href = '/account-suspended';
  }
};

const getSuspensionStatus = (payload: any): AccountModerationStatus | null => {
  if (payload?.moderationStatus?.isSuspended) return payload.moderationStatus;
  if (payload?.suspendedUntil !== undefined) {
    return {
      isSuspended: true,
      isPermanentBan: payload.suspendedUntil == null,
      suspendedUntil: payload.suspendedUntil,
      reason: payload.reason ?? null,
    };
  }
  return null;
};

// Interceptor cho các Gửi yêu cầu (Request): Chạy trước khi gửi API
api.interceptors.request.use(
  (config) => {
    // Lấy token từ nơi ta đã lưu (ví dụ local storage, cookie...) như ở đây là từ cookie
    // Trong Next.js thì cần check môi trường client (window)
    if (typeof window !== 'undefined') {
      const token = Cookies.get('accessToken');
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
    const suppressToast = response.config.suppressToast === true;

    // Lưu ý: Chỉ nên toast ở đây nếu bạn thực sự muốn báo lỗi dẫu HTTP là 200 JS
    // Tốt nhất là bỏ qua, nhưng tạm giữ nguyên theo code hiện tại
    if (!suppressToast && response.data.message) {
      toast.error(response.data.message);
    }
    return response;
  },
  async function onRejected(error) {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    // Bắt lỗi 401 Unauthorized và đảm bảo chưa từng retry
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      // Nếu đang trong quá trình refresh thì đưa vào hàng đợi
      if (isRefreshing) {
        return new Promise((resolve) => {
          subscribeTokenRefresh((newToken: string) => {
            originalRequest.headers.Authorization = `Bearer ${newToken}`;
            resolve(api(originalRequest));
          });
        });
      }

      isRefreshing = true;

      try {
        const refreshToken = Cookies.get('refreshToken');
        if (!refreshToken) {
          throw new Error('No refresh token available');
        }

        // Gọi API refresh token. KHÔNG dùng `api` để tránh loop vô tận
        const refreshUrl = `${api.defaults.baseURL}/Accounts/refresh-token`;
        const res = await axios.post<ReturnResult<TokenResponseDTO>>(refreshUrl, {
          refreshToken: refreshToken
        });

        const newTokens = res.data.result;
        if (!newTokens.accessToken) throw new Error('Failed to refresh token');

        // secure: true blocks cookie storage on plain http://localhost.
        // Only set Secure flag when running over HTTPS (production).
        const isSecureContext = typeof window !== 'undefined' && window.location.protocol === 'https:';
        const cookieOptions = { expires: 15, secure: isSecureContext, sameSite: 'strict' as const };
        Cookies.set('accessToken', newTokens.accessToken, cookieOptions);
        if (newTokens.refreshToken) {
          Cookies.set('refreshToken', newTokens.refreshToken, cookieOptions);
        }

        // Cập nhật Redux ngay lập tức để giao diện (Navbar, ...) không bị chớp hay lỗi
        const parsedData = parseUserFromToken(newTokens.accessToken, false);
        if (parsedData) {
          store.dispatch(setToken({
            accessToken: newTokens.accessToken,
            refreshToken: newTokens.refreshToken || refreshToken,
            user: parsedData.user
          }));
        }

        isRefreshing = false;
        onRerefreshed(newTokens.accessToken);

        // Gắn token mới và gọi lại request gốc bị lỗi lúc nãy
        originalRequest.headers.Authorization = `Bearer ${newTokens.accessToken}`;
        return api(originalRequest);

      } catch (refreshError) {
        const suspensionStatus = getSuspensionStatus((refreshError as any)?.response?.data);
        if (suspensionStatus) {
          redirectToSuspendedPage(suspensionStatus);
          return Promise.reject(refreshError);
        }

        // Refresh thất bại (hết hạn or khóa) => Đăng xuất
        isRefreshing = false;
        refreshSubscribers = [];
        clearAuthState();

        // Bạn có thể redirect về Auth
        if (typeof window !== 'undefined') {
          // Xóa redux sẽ được gọi khi User F5 login hoặc có thể hook vào event
          window.location.href = '/login';
        }

        return Promise.reject(refreshError);
      }
    }

    if (error.response?.status === 403) {
      const suspensionStatus = getSuspensionStatus(error.response.data);
      if (suspensionStatus) {
        redirectToSuspendedPage(suspensionStatus);
        return Promise.reject(error);
      }
    }

    // Các lỗi HTTP khác (400, 403, 500)
    if (!originalRequest?.suppressToast && error.response?.data?.message) {
      toast.error(error.response.data.message as string);
    }

    return Promise.reject(error);
  }
);

export default api;
