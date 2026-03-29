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
                    console.log(parsedData.user)
                    // const expiresDate = new Date(parsedData.exp * 1000);

                    Cookies.set("accessToken", data.result.accessToken, { expires: 15 }); // 15 days 
                    // (Cookie lưu accessToken có thể còn tồn tại dù accessToken đã hết hạn 
                    // vì việc check accessToken hết hạn chưa sẽ do server check. 
                    // Nếu cookie hết hạn cùng lúc với accessToken luôn thì middleware sẽ redirect user về login luôn (vì check ko thấy cookie lưu accessToken) 
                    // mà sẽ ko trigger đc axios interceptor để refetch lại token bằng refreshToken)
                    Cookies.set("refreshToken", data.result.refreshToken, { expires: 15 });  // 15 days
                    toast.success("Login successfully!");

                    const callbackUrl = searchParams.get('callbackUrl') || '/feed';
                    router.push(callbackUrl);
                }
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