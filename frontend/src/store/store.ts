import { configureStore, createReducer } from '@reduxjs/toolkit';
import authReducer from './slices/auth-slice';

// Placeholder reducer — thay thế bằng các slice thực khi build features
const placeholderReducer = createReducer({}, () => {});

// Bạn sẽ thêm các slice quản lý state toàn cục tại đây (ví dụ: auth, notifications...)
export const store = configureStore({
  reducer: {
    placeholder: placeholderReducer,
    auth: authReducer,
  },
  devTools: process.env.NODE_ENV !== 'production',
});

// Infer các `RootState` và `AppDispatch` types từ store để dùng với TypeScript
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
