import axios, { AxiosResponse, InternalAxiosRequestConfig } from "axios";
import { toast } from "sonner";
import { ReturnResult } from "@/types/common/return-result";
import { TokenResponseDTO } from "@/types/helper/token-response-dto";
import { clearToken, parseUserFromToken, setToken } from "@/store/slices/auth-slice";
import { store } from "@/store/store";
import { syncMessageServiceCookie } from "../utils/message-service.helper";

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
    baseURL: process.env.NEXT_PUBLIC_MESSAGE_API_URL_HTTPS || process.env.NEXT_PUBLIC_MESSAGE_API_URL_HTTP,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Interceptor cho các Gửi yêu cầu (Request): Chạy trước khi gửi API
api.interceptors.request.use(
    (config) => {
        // Lấy token từ Redux store
        const state = store.getState();
        const token = state.auth.accessToken;
        if (token && config.headers) {
            config.headers.Authorization = `Bearer ${token}`;
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
        // Lưu ý: Chỉ nên toast ở đây nếu bạn thực sự muốn báo lỗi dẫu HTTP là 200 JS
        // Tốt nhất là bỏ qua, nhưng tạm giữ nguyên theo code hiện tại
        if (response.data.message) {
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
                const state = store.getState();
                const refreshToken = state.auth.refreshToken;
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

                // Cập nhật Redux
                const parsedData = parseUserFromToken(newTokens.accessToken, false);
                if (parsedData) {
                    store.dispatch(setToken({
                        accessToken: newTokens.accessToken,
                        refreshToken: newTokens.refreshToken || refreshToken,
                        user: parsedData.user
                    }));
                }

                // Sync cookie to message-service domain for media loading
                syncMessageServiceCookie(newTokens.accessToken);

                isRefreshing = false;
                onRerefreshed(newTokens.accessToken);

                // Gắn token mới và gọi lại request gốc bị lỗi lúc nãy
                originalRequest.headers.Authorization = `Bearer ${newTokens.accessToken}`;
                return api(originalRequest);

            } catch (refreshError) {
                // Refresh thất bại (hết hạn or khóa) => Đăng xuất
                isRefreshing = false;
                refreshSubscribers = [];
                store.dispatch(clearToken());

                // Bạn có thể redirect về Auth
                if (typeof window !== 'undefined') {
                    // Xóa redux sẽ được gọi khi User F5 login hoặc có thể hook vào event
                    window.location.href = '/login';
                }

                return Promise.reject(refreshError);
            }
        }

        // Các lỗi HTTP khác (400, 403, 500)
        if (error.response?.data?.message) {
            toast.error(error.response.data.message as string);
        }

        return Promise.reject(error);
    }
);

export default api;