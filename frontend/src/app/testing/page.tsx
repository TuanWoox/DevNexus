import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import Link from "next/link"

export default function TestingPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-zinc-50 dark:bg-black p-4">
      <div className="w-full max-w-lg mb-8">
        <Link href="/">
          <Button variant="outline" className="mb-4">
            &larr; Quay lại trang chủ
          </Button>
        </Link>

        <Card>
          <CardHeader>
            <CardTitle>Đăng nhập tài khoản</CardTitle>
            <CardDescription>
              Đây là một ví dụ về form Card từ Shadcn UI.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" placeholder="m@example.com" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Mật khẩu</Label>
              <Input id="password" type="password" />
            </div>
          </CardContent>
          <CardFooter>
            <Button className="w-full">Đăng nhập</Button>
          </CardFooter>
        </Card>
      </div>

      <div className="max-w-2xl text-zinc-600 dark:text-zinc-400 text-sm leading-relaxed space-y-4">
        <h3 className="font-semibold text-zinc-900 dark:text-zinc-100 text-lg">
          Giải thích về Next.js App Router:
        </h3>
        <p>
          <strong>1. Routing dựa trên thư mục (File-system based routing):</strong><br />
          Trong Next.js (bản App Router), mỗi thư mục bên trong <code>src/app</code> đại diện cho một đường dẫn (route) trên URL. Để thư mục đó thành một trang có thể truy cập, bắt buộc phải có file <code>page.tsx</code> bên trong.
          <br />
          Ví dụ: Trang bạn đang xem nằm ở <code>/testing</code> vì file này được tạo tại <code>src/app/testing/page.tsx</code>. File <code>src/app/page.tsx</code> là trang chủ (<code>/</code>).
        </p>
        <p>
          <strong>2. Điều hướng với &lt;Link&gt;:</strong><br />
          Khi chuyển trang trong Next.js, chúng ta dùng component <code>&lt;Link href="..."&gt;</code> thay vì thẻ <code>&lt;a&gt;</code> thông thường. Điều này giúp Next.js tải trang mới mà không cần reload (tải lại) toàn bộ website, mang lại tốc độ như một Single Page Application (SPA).
        </p>
        <p>
          <strong>3. Shadcn UI Components:</strong><br />
          Khác với các thư viện như Material UI hay Ant Design, Shadcn không cài đặt qua npm như một gói chung. Lệnh <code>npx shadcn@latest add ...</code> sẽ <strong>tải trực tiếp mã nguồn</strong> của component đó (như Card, Input, Label) và lưu vào thư mục <code>src/components/ui/</code>. Điều này cho phép bạn vào thẳng file component đó để sửa code/Giao diện theo ý mình mà không bị gò bó.
        </p>
      </div>
    </div>
  )
}
