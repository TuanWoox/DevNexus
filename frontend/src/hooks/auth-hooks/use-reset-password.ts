import { accountService } from "@/services/account-service"
import { ResetPasswordDTO } from "@/types/account/reset-password-dto"
import { ReturnResult } from "@/types/common/return-result"
import { useMutation } from "@tanstack/react-query"
import { AxiosError } from "axios"
import { toast } from "sonner"

const useResetPassword = () => {
    const mutation = useMutation<ReturnResult<boolean>, AxiosError, ResetPasswordDTO>({
        mutationFn: (payload: ResetPasswordDTO) => {
            return accountService.resetPassword(payload);
        },
        onSuccess: (data) => {
            if (data.result) {
                toast.success("Password has been reset. Redirecting to login...")
            }
        }
    });

    return {
        resetPassword: mutation.mutate,
        isLoading: mutation.isPending
    }
}

export default useResetPassword;