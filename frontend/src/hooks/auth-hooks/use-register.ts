import { accountService } from "@/services/account-service";
import { RegisterAccountDTO } from "@/types/account/register-account-dto";
import { ReturnResult } from "@/types/common/return-result";
import { useMutation } from "@tanstack/react-query";
import { AxiosError } from "axios";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

const useRegister = () => {
    const router = useRouter();

    const registerMutation = useMutation<ReturnResult<boolean>, AxiosError, RegisterAccountDTO>({
        mutationFn: (payload: RegisterAccountDTO) => {
            return accountService.register(payload);
        },
        onSuccess: (data) => {
            if (!data.message) {
                toast.success("Register successfully!");
                router.push('/login');
            }
        }
    });

    return {
        registerFn: registerMutation.mutate,
        registerAsync: registerMutation.mutateAsync,
        isLoading: registerMutation.isPending,
        isError: registerMutation.isError,
        error: registerMutation.error,
        isSuccess: registerMutation.isSuccess,
        data: registerMutation.data
    }
}

export default useRegister;