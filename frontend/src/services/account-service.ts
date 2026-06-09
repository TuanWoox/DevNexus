import api from '@/lib/axiosConfig';
import { ChangePasswordDTO } from '@/types/account/change-password-dto';
import { ConfirmEmailDTO } from '@/types/account/confirm-email-dto';
import { LoginAccountDTO } from '@/types/account/login-account-dto';
import { RegisterAccountDTO } from '@/types/account/register-account-dto';
import { ResetPasswordDTO } from '@/types/account/reset-password-dto';
import { SetPasswordDTO } from '@/types/account/set-password-dto';
import { ReturnResult } from '@/types/common/return-result';
import { TokenResponseDTO } from '@/types/helper/token-response-dto';

export const accountService = {
    login: async (loginAccountDTO: LoginAccountDTO) => {
        const { data } = await api.post<ReturnResult<TokenResponseDTO>>('/Accounts/login', loginAccountDTO);
        return data;
    },
    register: async (registerAccountDTO: RegisterAccountDTO) => {
        const { data } = await api.post<ReturnResult<boolean>>('/Accounts/register', registerAccountDTO);
        return data;
    },
    refreshToken: async (refreshToken: string) => {
        const payload = { refreshToken };
        const { data } = await api.post<ReturnResult<TokenResponseDTO>>('/Accounts/refresh-token', payload);
        return data;
    },
    logout: async () => {
        const { data } = await api.post<ReturnResult<boolean>>('/Accounts/logout');
        return data;
    },
    changePassword: async (changePasswordDTO: ChangePasswordDTO) => {
        const { data } = await api.post<ReturnResult<boolean>>('/Accounts/change-password', changePasswordDTO);
        return data;
    },
    hasPassword: async (): Promise<boolean> => {
        const { data } = await api.get<ReturnResult<boolean>>('/Accounts/has-password');
        return data.result;
    },
    setPassword: async (setPasswordDTO: SetPasswordDTO): Promise<boolean> => {
        const { data } = await api.post<ReturnResult<boolean>>('/Accounts/set-password', setPasswordDTO);
        return data.result;
    },
    requestResetPassword: async (email: string) => {
        const payload = { email };
        const { data } = await api.post<ReturnResult<boolean>>('/Accounts/request-reset-password', payload);
        return data;
    },
    resetPassword: async (resetPasswordDTO: ResetPasswordDTO) => {
        const { data } = await api.post<ReturnResult<boolean>>('/Accounts/reset-password', resetPasswordDTO);
        return data;
    },
    requestConfirmEmail: async (email: string) => {
        const payload = { email };
        const { data } = await api.post<ReturnResult<boolean>>('/Accounts/request-confirm-email', payload);
        return data;
    },
    confirmEmail: async (confirmEmailDTO: ConfirmEmailDTO) => {
        const { data } = await api.post<ReturnResult<boolean>>('/Accounts/confirm-email', confirmEmailDTO);
        return data;
    },
    googleLogin: async (idToken: string) => {
        const payload = { idToken };
        const { data } = await api.post<ReturnResult<TokenResponseDTO>>('/Accounts/google-login', payload);
        return data;
    },
    githubLogin: async (payload: { code: string; redirectUri: string }) => {
        const { data } = await api.post<ReturnResult<TokenResponseDTO>>('/Accounts/github-login', payload);
        return data;
    }
}
