export function getWsBaseUrl(): string {
    const raw =
        process.env.NEXT_PUBLIC_NOTIFICATION_API_URL_HTTPS ||
        process.env.NEXT_PUBLIC_NOTIFICATION_API_URL_HTTP ||
        "/notification-service/api";

    if (/^https?:\/\//.test(raw)) {
        const url = new URL(raw);
        return url.origin;
    }

    if (typeof window !== "undefined") {
        return window.location.origin;
    }

    return "";
}

export function getWsPath(): string {
    const raw =
        process.env.NEXT_PUBLIC_NOTIFICATION_API_URL_HTTPS ||
        process.env.NEXT_PUBLIC_NOTIFICATION_API_URL_HTTP ||
        "/notification-service/api";

    if (/^https?:\/\//.test(raw)) {
        const url = new URL(raw);
        return url.pathname.startsWith("/notification-service")
            ? "/notification-service/socket.io"
            : "/socket.io";
    }

    return raw.startsWith("/notification-service")
        ? "/notification-service/socket.io"
        : "/socket.io";
}
