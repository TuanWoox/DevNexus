import { accountService } from "@/services/account-service"
import { ReturnResult } from "@/types/common/return-result"
import { useMutation } from "@tanstack/react-query"
import { AxiosError } from "axios"
import { toast } from "sonner"

const useRequestResetPassword = () => {
    const mutation = useMutation<ReturnResult<boolean>, AxiosError, string>({
        mutationFn: (email: string) => {
            return accountService.requestResetPassword(email);
        },
        onSuccess: (data) => {
            if (data.result) {
                toast.success("A password reset link has been successfully sent to your email address.")
            }
        }
    });

    return {
        requestResetPassword: mutation.mutate,
        requestResetPasswordAsync: mutation.mutateAsync,
        isLoading: mutation.isPending,
        isError: mutation.isError,
        error: mutation.error,
        isSuccess: mutation.isSuccess,
        data: mutation.data
    }
}

export default useRequestResetPassword;