export function getWsBaseUrl(): string {
    const httpUrl =
        process.env.NEXT_PUBLIC_NOTIFICATION_API_URL_HTTPS ||
        process.env.NEXT_PUBLIC_NOTIFICATION_API_URL_HTTP ||
        "http://localhost:3002/notification-service/api";

    return new URL(httpUrl).origin;
}
