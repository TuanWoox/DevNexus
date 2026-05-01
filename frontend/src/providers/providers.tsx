"use client";

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { Provider as ReduxProvider } from 'react-redux';
import { store } from '@/store/store';
import { useState, ReactNode } from 'react';
import { ThemeProvider } from '@/components/theme-provider';
import { Toaster } from 'sonner';
import { AuthProvider } from './auth-provider';

interface ProvidersProps {
  children: ReactNode;
}

export function Providers({ children }: ProvidersProps) {
  // Tạo QueryClient instance duy nhất trong component để tránh re-create khi re-render
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            refetchOnWindowFocus: false, // Tắt tự động call lại API khi chuyển tab
            retry: 1,                   // Chỉ thử lại API lỗi 1 lần duy nhất
            staleTime: 5 * 60 * 1000,   // Dữ liệu sẽ cũ sau 5 phút (tránh gọi API liên tục)
          },
        },
      })
  );

  return (
    <ThemeProvider>
      <ReduxProvider store={store}>
        <AuthProvider>
          <QueryClientProvider client={queryClient}>
            {children}
            {process.env.NODE_ENV === 'development' && <ReactQueryDevtools initialIsOpen={false} position="bottom" />}
            <Toaster richColors expand={false} position="top-right" closeButton />
          </QueryClientProvider>
        </AuthProvider>
      </ReduxProvider>
    </ThemeProvider>
  );
}
