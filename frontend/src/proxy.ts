import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify, type JWTPayload } from 'jose';

// ─── JWT Payload shape ────────────────────────────────────────────────────────
// Dùng URL-format claims cho nhất quán với auth-slice.ts
interface DevNexusJWTPayload extends JWTPayload {
    "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier"?: string;
    "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name"?: string;
    "http://schemas.microsoft.com/ws/2008/06/identity/claims/role"?: string[] | string;
    profileId?: string;
}

// ─── Route config ─────────────────────────────────────────────────────────────

// Trang Auth — đã đăng nhập thì đá về feed
const authRoutes = ['/login', '/register', '/forgot-password', '/reset-password'];

// Routes cần bảo vệ + role tương ứng
// roles: [] = cần đăng nhập (bất kỳ role), roles: ['Admin'] = chỉ Admin
// More specific admin routes must be declared before the general /admin rule.
const routeRules = [
    {
        pathMatch: /^\/admin\/(moderation|posts|tags)(\/.*)?$/,
        roles: ['Admin', 'Moderator'],
    },
    {
        pathMatch: /^\/admin/,
        roles: ['Admin'],
    },
    {
        pathMatch: /^\/(feed|post|questions|communities|messages|notifications|profile)/,
        roles: [],
    },
];

// ─── Helper: verify JWT với jose ──────────────────────────────────────────────
// jose.jwtVerify thực hiện cryptographic signature verification (không chỉ base64 decode).
// Throw nếu: token giả mạo, chữ ký sai, hết hạn, format lỗi.
async function verifyToken(token: string): Promise<DevNexusJWTPayload | null> {
    const secret = process.env.JWT_SECRET;
    if (!secret) {
        // JWT_SECRET chưa được set — log warning và fail-safe (từ chối)
        console.error('[proxy] JWT_SECRET is not set. Cannot verify tokens.');
        return null;
    }

    try {
        const { payload } = await jwtVerify<DevNexusJWTPayload>(
            token,
            new TextEncoder().encode(secret),
        );
        return payload;
    } catch {
        // Token giả, chữ ký sai, hết hạn → trả null → caller redirect về /login
        return null;
    }
}

// ─── Helper: normalize role claim ────────────────────────────────────────────
function normalizeRoles(raw?: string[] | string): string[] {
    if (!raw) return [];
    return Array.isArray(raw) ? raw : [raw];
}

// ─── Proxy function ───────────────────────────────────────────────────────────
// Next.js 16: export function proxy() — codemod @next/codemod@canary middleware-to-proxy
export async function proxy(request: NextRequest) {
    const { pathname } = request.nextUrl;
    const token = request.cookies.get('accessToken')?.value;
    const refreshToken = request.cookies.get('refreshToken')?.value;

    // ── 1. Auth pages: đá user đã login về /feed ──────────────────────────────
    if (authRoutes.some(route => pathname.startsWith(route))) {
        if (token || refreshToken) {
            return NextResponse.redirect(new URL('/feed', request.url));
        }
        return NextResponse.next();
    }

    // ── 2. Không phải route cần bảo vệ → cho qua ─────────────────────────────
    const matchedRule = routeRules.find(rule => rule.pathMatch.test(pathname));
    if (!matchedRule) {
        return NextResponse.next();
    }

    // ── 3. Không có cả hai token → chưa đăng nhập → login ───────────────────
    if (!token && !refreshToken) {
        const loginUrl = new URL('/login', request.url);
        loginUrl.searchParams.set('callbackUrl', pathname);
        return NextResponse.redirect(loginUrl);
    }

    // ── 4. Mất accessToken nhưng còn refreshToken → bypass cho Axios refresh ─
    if (!token && refreshToken) {
        return NextResponse.next();
    }

    // ── 5. Verify token bằng jose (cryptographic) ─────────────────────────────
    const payload = await verifyToken(token!);

    if (!payload) {
        // Token giả mạo, chữ ký sai, hoặc hết hạn và không có refreshToken
        if (refreshToken) {
            // Còn refreshToken → bypass, để Axios tự refresh
            return NextResponse.next();
        }

        // Không có gì cả → xóa cookie bẩn và redirect login
        const loginUrl = new URL('/login', request.url);
        loginUrl.searchParams.set('callbackUrl', pathname);
        const response = NextResponse.redirect(loginUrl);
        response.cookies.delete('accessToken');
        return response;
    }

    // ── 6. RBAC: kiểm tra role nếu route yêu cầu ─────────────────────────────
    if (matchedRule.roles.length > 0) {
        const roleRaw = payload["http://schemas.microsoft.com/ws/2008/06/identity/claims/role"];
        const userRoles = normalizeRoles(roleRaw);

        const hasPermission = matchedRule.roles.some(r => userRoles.includes(r));
        if (!hasPermission) {
            return NextResponse.redirect(new URL('/unauthorized', request.url));
        }
    }

    // ── 7. Hợp lệ → cho qua ──────────────────────────────────────────────────
    return NextResponse.next();
}

// Chỉ áp dụng cho các route hệ thống, bỏ qua assets / api
export const config = {
    matcher: [
        '/((?!api|_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)',
    ],
};