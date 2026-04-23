import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { jwtDecode } from "jwt-decode";

/* =========================
   TYPES
========================= */

interface DecodedToken {
    "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier"?: string;
    "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name"?: string;
    "http://schemas.microsoft.com/ws/2008/06/identity/claims/role"?: string[] | string;
    profileId?: string;
    exp: number;
    iss?: string;
    aud?: string;
}

export interface User {
    id: string;
    userName: string;
    profileId?: string;
    roles: string[];
}

interface AuthState {
    accessToken: string | null;
    refreshToken: string | null;
    isAuthenticated: boolean;
    user: User | null;
}

/* =========================
   HELPERS
========================= */

const normalizeRoles = (role?: string[] | string): string[] => {
    if (!role) return [];
    return Array.isArray(role) ? role : [role];
};

export const parseUserFromToken = (token: string, ignoreExpiration = false): { user: User, exp: number } | null => {
    try {
        const decoded = jwtDecode<DecodedToken>(token);

        const isExpired = decoded.exp * 1000 < Date.now();
        if (isExpired && !ignoreExpiration) return null;

        const id = decoded["http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier"] || "";
        const userName = decoded["http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name"] || "";
        const role = decoded["http://schemas.microsoft.com/ws/2008/06/identity/claims/role"];

        return {
            user: {
                id,
                userName,
                profileId: decoded.profileId,
                roles: normalizeRoles(role),
            },
            exp: decoded.exp
        };
    } catch {
        return null;
    }
};

/* =========================
   INITIAL STATE
========================= */

const initialState: AuthState = {
    accessToken: null,
    refreshToken: null,
    isAuthenticated: false,
    user: null,
};

/* =========================
   SLICE
========================= */

const authSlice = createSlice({
    name: "auth",
    initialState,
    reducers: {
        setToken: (state, action: PayloadAction<{ accessToken: string | null, refreshToken: string | null, user: User }>) => {
            const { accessToken, refreshToken, user } = action.payload;
            state.accessToken = accessToken;
            state.refreshToken = refreshToken;
            state.isAuthenticated = true;
            state.user = user;
        },

        clearToken: (state) => {
            state.accessToken = null;
            state.refreshToken = null;
            state.isAuthenticated = false;
            state.user = null;
        },
    },
});

export const { setToken, clearToken } = authSlice.actions;
export default authSlice.reducer;
