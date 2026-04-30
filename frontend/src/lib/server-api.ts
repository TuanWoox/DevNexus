// Server-only: không import axiosConfig, js-cookie, hoặc Redux store.
// BASE_URL từ env var đã bao gồm /api suffix (ví dụ: http://localhost:5105/api)
// nên các path truyền vào chỉ cần dạng /Posts/paging, không thêm /api.
import { cookies } from 'next/headers';
import { ReturnResult } from '@/types/common/return-result';

function getBaseUrl(): string {
    const url =
        process.env.NEXT_PUBLIC_API_URL_HTTPS ||
        process.env.NEXT_PUBLIC_API_URL_HTTP;
    if (!url) {
        throw new Error(
            'Missing API base URL: set NEXT_PUBLIC_API_URL_HTTPS or NEXT_PUBLIC_API_URL_HTTP in .env'
        );
    }
    return url;
}

export async function serverPost<T>(
    path: string,
    body: unknown,
    options: { auth?: boolean } = { auth: true }
): Promise<T> {
    const headers: Record<string, string> = {
        'Content-Type': 'application/json',
    };

    if (options.auth) {
        const cookieStore = await cookies();
        const accessToken = cookieStore.get('accessToken')?.value;
        if (accessToken) {
            headers['Authorization'] = `Bearer ${accessToken}`;
        }
    }

    const res = await fetch(`${getBaseUrl()}${path}`, {
        method: 'POST',
        headers,
        body: JSON.stringify(body),
        // Feed là user-specific (authenticated) → không cache trên CDN/server
        cache: 'no-store',
    });

    if (!res.ok) {
        throw new Error(`serverPost ${res.status}: ${path}`);
    }

    const json: ReturnResult<T> = await res.json();

    // Business error: backend returns HTTP 200 with non-null message on failure
    if (json.message) {
        throw new Error(json.message);
    }

    // Type guard: result should never be null when message is null per backend contract.
    // Throw instead of returning null to keep Promise<T> signature honest —
    // callers must not silently receive null without knowing.
    if (json.result === null || json.result === undefined) {
        throw new Error(`serverPost: null result from ${path} — backend contract violation`);
    }

    return json.result;
}
