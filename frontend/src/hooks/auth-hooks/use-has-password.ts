import { accountService } from "@/services/account-service"
import { useQuery } from "@tanstack/react-query"

export const useHasPassword = () => {
    return useQuery({
        queryKey: ["hasPassword"],
        queryFn: () => accountService.hasPassword(),
    })
}