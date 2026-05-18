import { accountService } from "@/services/account-service"
import { ChangePasswordDTO } from "@/types/account/change-password-dto"
import { useMutation } from "@tanstack/react-query"
import { toast } from "sonner"

export const useChangePassword = () => {
    return useMutation({
        mutationFn: (changePasswordDTO: ChangePasswordDTO) => accountService.changePassword(changePasswordDTO),
        onSuccess: (data) => {
            if (data) {
                toast.success("Password successfully changed!")
            }
        }
    })
}