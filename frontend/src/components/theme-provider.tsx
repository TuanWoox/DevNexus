"use client";

import * as React from "react";
import { ThemeProvider as NextThemesProvider } from "next-themes";

export function ThemeProvider({
  children,
  ...props
}: React.ComponentProps<typeof NextThemesProvider>) {
  return (
    <NextThemesProvider
      attribute="class"           // ✅ BẮT BUỘC — Tailwind dark: dùng class trên <html>
      defaultTheme="dark"         // ✅ DevNexus mặc định dark
      enableSystem={true}         // ✅ Hỗ trợ system theme
      disableTransitionOnChange={false}
      {...props}
    >
      {children}
    </NextThemesProvider>
  );
}
