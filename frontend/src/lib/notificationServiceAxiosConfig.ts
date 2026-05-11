import axios from "axios";
import { store } from "@/store/store";

const notificationApi = axios.create({
    baseURL:
        process.env.NEXT_PUBLIC_NOTIFICATION_API_URL_HTTPS ||
        process.env.NEXT_PUBLIC_NOTIFICATION_API_URL_HTTP ||
        "http://localhost:3002/notification-service/api",
    withCredentials: true,
});

notificationApi.interceptors.request.use((config) => {
    const token = store.getState().auth.accessToken;
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

export default notificationApi;
