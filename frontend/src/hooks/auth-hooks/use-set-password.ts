import { accountService } from "@/services/account-service"
import { SetPasswordDTO } from "@/types/account/set-password-dto"
import { useMutation } from "@tanstack/react-query"
import { toast } from "sonner"

export const useSetPassword = () => {
    return useMutation({
        mutationFn: (setPasswordDTO: SetPasswordDTO) => accountService.setPassword(setPasswordDTO),
        onSuccess: (data) => {
            if (data) {
                toast.success("Password successfully set!")
            }
        }
    })
}