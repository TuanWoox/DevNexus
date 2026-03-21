import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { TokenResponseDTO } from "@/types/helper/token-response-dto";
import { jwtDecode } from "jwt-decode";

/* =========================
   TYPES
========================= */

interface DecodedToken {
    nameid: string;
    unique_name: string;
    profileId?: string;
    role?: string[] | string;
    exp: number;
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

// Convert role -> string[]
const normalizeRoles = (role?: string[] | string): string[] => {
    if (!role) return [];
    return Array.isArray(role) ? role : [role];
};

// Parse user từ JWT
const parseUserFromToken = (token: string): User | null => {
    try {
        const decoded = jwtDecode<DecodedToken>(token);

        // Check expire
        const isExpired = decoded.exp * 1000 < Date.now();
        if (isExpired) return null;

        return {
            id: decoded.nameid,
            userName: decoded.unique_name,
            profileId: decoded.profileId,
            roles: normalizeRoles(decoded.role),
        };
    } catch {
        return null;
    }
};

/* =========================
   INITIAL STATE (có load từ localStorage)
========================= */

const getInitialState = (): AuthState => {
    if (typeof window === "undefined") {
        return {
            accessToken: null,
            refreshToken: null,
            isAuthenticated: false,
            user: null,
        };
    }

    const accessToken = localStorage.getItem("accessToken");
    const refreshToken = localStorage.getItem("refreshToken");

    if (!accessToken) {
        return {
            accessToken: null,
            refreshToken: null,
            isAuthenticated: false,
            user: null,
        };
    }

    const user = parseUserFromToken(accessToken);

    if (!user) {
        localStorage.removeItem("accessToken");
        localStorage.removeItem("refreshToken");

        return {
            accessToken: null,
            refreshToken: null,
            isAuthenticated: false,
            user: null,
        };
    }

    return {
        accessToken,
        refreshToken,
        isAuthenticated: true,
        user,
    };
};

/* =========================
   SLICE
========================= */

const authSlice = createSlice({
    name: "auth",
    initialState: getInitialState(),
    reducers: {
        setToken: (state, action: PayloadAction<TokenResponseDTO>) => {
            const { accessToken, refreshToken } = action.payload;

            const user = parseUserFromToken(accessToken);

            if (!user) {
                // Token lỗi hoặc hết hạn
                state.accessToken = null;
                state.refreshToken = null;
                state.isAuthenticated = false;
                state.user = null;
                return;
            }

            // Save to state
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