'use client';

import { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { setToken, clearToken, setInitialized, parseUserFromToken } from '@/store/slices/auth-slice';
import Cookies from 'js-cookie';

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const dispatch = useDispatch();

    useEffect(() => {
        // Chạy một lần duy nhất khi app mount trên Client
        const accessToken = Cookies.get('accessToken');
        const refreshToken = Cookies.get('refreshToken');

        if (accessToken) {
            // Nếu có refreshToken, cho phép tin tưởng tạm thời accessToken (dù hết hạn)
            // Axios Interceptor sẽ nhận diện 401 trên request đầu tiên và tự refresh ngầm
            const parsedData = parseUserFromToken(accessToken, !!refreshToken);

            if (parsedData) {
                dispatch(setToken({
                    accessToken,
                    refreshToken: refreshToken ?? null,
                    user: parsedData.user
                }));
                dispatch(setInitialized());
            } else {
                // Token lỗi hoặc hết hạn mà KHÔNG CÓ refreshToken
                dispatch(clearToken());
            }
        } else {
            dispatch(clearToken());
        }
    }, [dispatch]);

    // Vẫn render app bình thường. Redux ban đầu sẽ là false (khớp SSR). 
    // Sau khi mount, useEffect chạy và update thành true nếu có token.
    return <>{children}</>;
}
