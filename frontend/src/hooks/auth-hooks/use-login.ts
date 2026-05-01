import { accountService } from "@/services/account-service";
import { setToken, parseUserFromToken } from "@/store/slices/auth-slice";
import { LoginAccountDTO } from "@/types/account/login-account-dto";
import { useMutation } from "@tanstack/react-query";
import { useRouter, useSearchParams } from "next/navigation";
import { useDispatch } from "react-redux";
import { toast } from "sonner";
import Cookies from "js-cookie";

const useLogin = () => {
    const dispatch = useDispatch();
    const router = useRouter();
    const searchParams = useSearchParams();

    const loginMutation = useMutation({
        mutationFn: (payload: LoginAccountDTO) => {
            return accountService.login(payload);
        },
        onSuccess: (data) => {
            if (data.result.accessToken && data.result.refreshToken) {
                const parsedData = parseUserFromToken(data.result.accessToken);

                if (parsedData) {
                    dispatch(setToken({
                        accessToken: data.result.accessToken,
                        refreshToken: data.result.refreshToken,
                        user: parsedData.user
                    }));

                    // Detect if running under HTTPS (production)
                    const isSecureContext =
                        typeof window !== "undefined" &&
                        window.location.protocol === "https:";

                    // Balanced config for both Docker (HTTP) and production (HTTPS)
                    const cookieOptions = {
                        expires: 7, // keep shorter for better control
                        secure: isSecureContext,
                        sameSite: "lax" as const
                    };

                    Cookies.set("accessToken", data.result.accessToken, cookieOptions);
                    Cookies.set("refreshToken", data.result.refreshToken, cookieOptions);

                    toast.success("Login successfully!");

                    const callbackUrl = searchParams.get("callbackUrl") || "/feed";
                    router.push(callbackUrl);
                }
            }
        }
    });

    return {
        login: loginMutation.mutate,
        isAuthenticating: loginMutation.isPending,
        authenError: loginMutation.error
    };
};

export default useLogin;