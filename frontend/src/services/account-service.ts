import api from '@/lib/axiosConfig';
import { ChangePasswordDTO } from '@/types/account/change-password-dto';
import { ConfirmEmailDTO } from '@/types/account/confirm-email-dto';
import { LoginAccountDTO } from '@/types/account/login-account-dto';
import { RegisterAccountDTO } from '@/types/account/register-account-dto';
import { ResetPasswordDTO } from '@/types/account/reset-password-dto';
import { ReturnResult } from '@/types/common/return-result';
import { TokenResponseDTO } from '@/types/helper/token-response-dto';

export const accountService = {
    login: async (loginAccountDTO: LoginAccountDTO) => {
        const { data } = await api.post<ReturnResult<TokenResponseDTO>>('/Accounts/login', loginAccountDTO);
        return data;
    },
    register: async (registerAccountDTO: RegisterAccountDTO) => {
        const { data } = await api.post<ReturnResult<boolean>>('Accounts/register', registerAccountDTO);
        return data;
    },
    refreshToken: async (refreshToken: string) => {
        const { data } = await api.post<ReturnResult<TokenResponseDTO>>('Accounts/refresh-token', refreshToken);
        return data;
    },
    logout: async () => {
        const { data } = await api.post<ReturnResult<boolean>>('Accounts/logout');
        return data;
    },
    changePassword: async (changePasswordDTO: ChangePasswordDTO) => {
        const { data } = await api.post<ReturnResult<boolean>>('Accounts/change-password', changePasswordDTO);
        return data;
    },
    requestResetPassword: async (email: string) => {
        const { data } = await api.post<ReturnResult<boolean>>('Accounts/request-reset-password', email);
        return data;
    },
    resetPassword: async (resetPasswordDTO: ResetPasswordDTO) => {
        const { data } = await api.post<ReturnResult<boolean>>('Accounts/reset-password', resetPasswordDTO);
        return data;
    },
    requestConfirmEmail: async (email: string) => {
        const { data } = await api.post<ReturnResult<boolean>>('Accounts/request-confirm-email', email);
        return data;
    },
    confirmEmail: async (confirmEmailDTO: ConfirmEmailDTO) => {
        const { data } = await api.post<ReturnResult<boolean>>('Accounts/confirm-email', confirmEmailDTO);
        return data;
    },
    googleLogin: async (idToken: string) => {
        const { data } = await api.post<ReturnResult<TokenResponseDTO>>('Accounts/google-login', idToken);
        return data;
    },
    githubLogin: async (accessToken: string) => {
        const { data } = await api.post<ReturnResult<TokenResponseDTO>>('Accounts/github-login', accessToken);
        return data;
    }
}