import { accountService } from "@/services/account-service";
import { useMutation } from "@tanstack/react-query";
import { CredentialResponse } from "@react-oauth/google";
import { toast } from "sonner";
import { useAuthTokenResult } from "./use-auth-token-result";

const useGoogleLogin = () => {
    const { handleAuthTokenResult } = useAuthTokenResult();

    const mutation = useMutation({
        mutationFn: (idToken: string) => accountService.googleLogin(idToken),
        onSuccess: (data) => handleAuthTokenResult(data, "Signed in with Google.")
    });

    const loginWithCredential = (response: CredentialResponse) => {
        if (!response.credential) {
            toast.error("Google login did not return an ID token.");
            return;
        }

        mutation.mutate(response.credential);
    };

    return {
        loginWithCredential,
        isPending: mutation.isPending
    };
};

export default useGoogleLogin;
