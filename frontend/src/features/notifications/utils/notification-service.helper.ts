export function getWsBaseUrl(): string {
    const raw =
        process.env.NEXT_PUBLIC_NOTIFICATION_API_URL_HTTPS ||
        process.env.NEXT_PUBLIC_NOTIFICATION_API_URL_HTTP ||
        "/notification-service/api";

    // If absolute URL
    if (/^https?:\/\//.test(raw)) {
        const url = new URL(raw);
        if (process.env.NODE_ENV == "development") return url.origin;
        // remove trailing /api for websocket base
        return `${url.origin}/notification-service`;
    }

    // If relative → use browser origin
    if (typeof window !== "undefined") {
        return `${window.location.origin}/notification-service`;
    }

    return "";
}