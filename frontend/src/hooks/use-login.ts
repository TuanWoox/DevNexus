import { accountService } from "@/services/account-service";
import { setToken } from "@/store/slices/auth-slice";
import { LoginAccountDTO } from "@/types/account/login-account-dto";
import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useDispatch } from "react-redux"
import { toast } from "sonner";

const useLogin = () => {
    const dispatch = useDispatch();
    const router = useRouter();

    const loginMutation = useMutation({
        mutationFn: (payload: LoginAccountDTO) => {
            return accountService.login(payload);
        },
        onSuccess: (data) => {
            if (data.result.accessToken && data.result.refreshToken) {
                dispatch(setToken(data.result));
                window.localStorage.setItem("accessToken", data.result.accessToken);
                window.localStorage.setItem("refreshToken", data.result.refreshToken);
                toast.success("Login successfully!");
                router.push('/feed');
            }
        }
    });

    return {
        login: loginMutation.mutate,
        isAuthenticating: loginMutation.isPending,
        authenError: loginMutation.error
    }
}

export default useLogin;