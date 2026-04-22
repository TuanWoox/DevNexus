"use client";

import * as React from "react";
import { ThemeProvider as NextThemesProvider, useTheme } from "next-themes";

// 1. Tạo một component nhỏ để đồng bộ Theme ra thẻ <html>
function GlobalThemeSyncer() {
  // resolvedTheme sẽ trả về chuẩn 'dark' hoặc 'light' (kể cả khi user chọn 'system')
  const { resolvedTheme } = useTheme();

  React.useEffect(() => {
    if (resolvedTheme) {
      // Ép thư viện @uiw(thư viện markdown editor) hiểu theme toàn cục 
      // bằng cách gắn data-color-mode vào thẻ HTML. Tránh gọi lại useTheme() trong component
      // dẫn đến phải render lại component và gây ra lỗi hydration mismatch.
      document.documentElement.setAttribute("data-color-mode", resolvedTheme);
    }
  }, [resolvedTheme]);

  return null;
}

export function ThemeProvider({
  children,
  ...props
}: React.ComponentProps<typeof NextThemesProvider>) {
  return (
    <NextThemesProvider
      attribute="class"         // Dùng cho Tailwind
      defaultTheme="dark"
      enableSystem={true}
      disableTransitionOnChange={false}
      {...props}
    >
      {/* 2. Đặt Syncer vào bên trong Provider để nó có thể xài hook useTheme() */}
      <GlobalThemeSyncer />
      {children}
    </NextThemesProvider>
  );
}