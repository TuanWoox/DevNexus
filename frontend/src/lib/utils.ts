// Import thư viện clsx
// clsx giúp chúng ta kết hợp (combine) nhiều className lại với nhau
// và cho phép viết điều kiện (conditional classes) rất gọn
import { clsx, type ClassValue } from "clsx"

// Import thư viện tailwind-merge
// tailwind-merge giúp loại bỏ các class Tailwind bị trùng hoặc xung đột
// Ví dụ: "p-2 p-4" -> chỉ giữ lại "p-4"
import { twMerge } from "tailwind-merge"

// Hàm cn (class name)
// Đây là utility function được shadcn/ui tạo ra để dùng trong toàn bộ project
// Nó giúp:
// 1. Combine nhiều class lại (nhờ clsx)
// 2. Merge và xử lý conflict của Tailwind classes (nhờ twMerge)
export function cn(...inputs: ClassValue[]) {
  // Bước 1: clsx(inputs)
  // -> ghép tất cả class lại thành một string
  // Bước 2: twMerge(...)
  // -> xử lý các class Tailwind bị trùng/xung đột
  return twMerge(clsx(inputs))
}