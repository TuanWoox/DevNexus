import { accountService } from "@/services/account-service";
import { LoginAccountDTO } from "@/types/account/login-account-dto";
import { useMutation } from "@tanstack/react-query";
import { useAuthTokenResult } from "./use-auth-token-result";

const useLogin = () => {
    const { handleAuthTokenResult } = useAuthTokenResult();

    const loginMutation = useMutation({
        mutationFn: (payload: LoginAccountDTO) => accountService.login(payload),
        onSuccess: (data) => handleAuthTokenResult(data, "Login successfully!")
    });

    return {
        login: loginMutation.mutate,
        isAuthenticating: loginMutation.isPending,
        authenError: loginMutation.error
    };
};

export default useLogin;
