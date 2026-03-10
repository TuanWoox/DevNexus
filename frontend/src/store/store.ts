import { configureStore } from '@reduxjs/toolkit';

// Bạn sẽ thêm các slice quản lý state toàn cục tại đây (ví dụ: Theme, Notifications...)
export const store = configureStore({
  reducer: {},
  devTools: process.env.NODE_ENV !== 'production',
});

// Infer các `RootState` và `AppDispatch` types từ store để dùng với TypeScript
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
