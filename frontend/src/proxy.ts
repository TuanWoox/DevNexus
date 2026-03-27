import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtDecode } from 'jwt-decode';

// Định nghĩa cấu trúc Role trong Token của bạn
interface DecodedToken {
    nameid: string;
    unique_name: string;
    role?: string[] | string;
    exp: number;
}

// Danh sách các route Auth (Nếu đã đăng nhập thì không được vào nữa)
const authRoutes = ['/login', '/register', '/forgot-password', '/reset-password'];

// Cấu hình các Route cần bảo vệ và Role tương ứng
// App có 3 roles là Admin, Moderator, Developer
const routeRules = [
    {
        pathMatch: /^\/admin/,
        roles: ['Admin'] // Chỉ Admin được vào toàn bộ route /admin/...
    },
    {
        pathMatch: /^\/moderation/,
        roles: ['Admin', 'Moderator'] // Mod và Admin được vào khu vực kiểm duyệt
    },
    {
        // Gộp các route chức năng cốt lõi của mạng xã hội học tập
        pathMatch: /^\/(feed|post|questions|communities|messages|notifications|profile)/,
        roles: [] // Mảng rỗng = Cần đăng nhập (Bất kỳ ai có token hợp lệ đều vào được)
    }
];

// NEXT.JS 16: Bắt buộc dùng export function proxy
export function proxy(request: NextRequest) {
    const { pathname } = request.nextUrl;
    const token = request.cookies.get('accessToken')?.value;
    const refreshToken = request.cookies.get('refreshToken')?.value;

    // 1. Chặn user ĐÃ đăng nhập quay lại trang Auth (Đá về trang chủ /feed)
    if (authRoutes.some(route => pathname.startsWith(route))) {
        // Có bất kỳ token nào thì cũng coi là đang có session, đá về feed
        if (token || refreshToken) {
            return NextResponse.redirect(new URL('/feed', request.url));
        }
        return NextResponse.next();
    }

    // 2. Kiểm tra xem route hiện tại có nằm trong danh sách cần bảo vệ không?
    const matchedRule = routeRules.find(rule => rule.pathMatch.test(pathname));

    // Nếu không phải route cần bảo vệ (VD: /, /about, /faq), cho phép đi tiếp
    if (!matchedRule) {
        return NextResponse.next();
    }

    // 3. Nếu KHÔNG CÓ CẢ HAI token -> Chắc chắn chưa đăng nhập -> Đá về Login
    if (!token && !refreshToken) {
        const loginUrl = new URL('/login', request.url);
        loginUrl.searchParams.set('callbackUrl', pathname);
        return NextResponse.redirect(loginUrl);
    }

    // 4. Nếu mất accessToken nhưng VẪN CÒN refreshToken -> Cho đi qua
    // Để Axios ở Client tự gọi API lấy token mới
    if (!token && refreshToken) {
        return NextResponse.next();
    }


    // 4. Giải mã Token để lấy Role (Edge Runtime an toàn với jwt-decode)
    try {
        const decoded = jwtDecode<DecodedToken>(token!);

        // Kiểm tra Token hết hạn (Dù Axios có refresh, những đôi khi user vào thẳng URL bằng trình duyệt)
        if (decoded.exp * 1000 < Date.now()) {
            const hasRefreshToken = request.cookies.has('refreshToken');
            // Nếu có refreshToken, ta bypass (cho đi tiếp) để phía Frontend (Axios) tự bắt lỗi 401 và gọi API Refresh.
            // Nếu KHÔNG có refreshToken, đá văng về login.
            if (!hasRefreshToken) {
                const loginUrl = new URL('/login', request.url);
                loginUrl.searchParams.set('callbackUrl', pathname);

                // Xóa cookie cũ đã hết hạn để trình duyệt sạch sẽ
                const response = NextResponse.redirect(loginUrl);
                response.cookies.delete('accessToken');
                return response;
            }
        }

        // Chuẩn hóa role thành mảng string[]
        const userRoles = Array.isArray(decoded.role)
            ? decoded.role
            : decoded.role ? [decoded.role] : [];

        // 5. Phân Quyền: Nếu route yêu cầu quyền cụ thể (Admin/Mod)
        if (matchedRule.roles.length > 0) {
            const hasPermission = matchedRule.roles.some(requiredRole => userRoles.includes(requiredRole));

            // Nếu không có quyền -> Chuyển hướng tới trang 403 Access Denied
            if (!hasPermission) {
                return NextResponse.redirect(new URL('/unauthorized', request.url));
            }
        }

        // Hợp lệ, cho qua
        return NextResponse.next();

    } catch {
        // Token bị lỗi định dạng hoặc bị giả mạo sửa đổi payload -> Xóa token và bắt đăng nhập lại
        const response = NextResponse.redirect(new URL('/login', request.url));
        response.cookies.delete('accessToken');
        response.cookies.delete('refreshToken');
        return response;
    }
}

// Chỉ áp dụng Proxy cho các route hệ thống, bỏ qua assets / api
export const config = {
    matcher: [
        /*
         * Match all request paths except for the ones starting with:
         * - api (API routes)
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico, sitemap.xml, robots.txt (metadata files)
         */
        '/((?!api|_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)',
    ],
};