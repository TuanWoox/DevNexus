import { accountService } from "@/services/account-service";
import { clearToken } from "@/store/slices/auth-slice";
import { ReturnResult } from "@/types/common/return-result";
import { useMutation } from "@tanstack/react-query";
import { AxiosError } from "axios";
import { useRouter } from "next/navigation";
import { useDispatch } from "react-redux";
import { toast } from "sonner";
import Cookies from "js-cookie";

const useLogout = () => {
    const dispatch = useDispatch();
    const router = useRouter();

    const logoutMutation = useMutation<ReturnResult<boolean>, AxiosError>({
        mutationFn: () => {
            return accountService.logout();
        },
        onSettled: () => {
            // Sử dụng onSettled thay vì onSuccess
            // Dù Backend trả về lỗi (Ví dụ: Server sập, Token hết hạn không gọi được API),
            // ta VẪN dọn dẹp Cookie và State ở Client để ép User văng ra trang Login.
            Cookies.remove("accessToken");
            Cookies.remove("refreshToken");
            dispatch(clearToken());
            
            toast.success("Logout successfully!");
            router.push('/login');
        }
    });

    return {
        logout: logoutMutation.mutate,
        logoutAsync: logoutMutation.mutateAsync,
        isLoggingOut: logoutMutation.isPending,
        logoutError: logoutMutation.error
    };
};

export default useLogout;
