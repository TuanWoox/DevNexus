import { clearToken, parseUserFromToken, setToken } from "@/store/slices/auth-slice";
import { ReturnResult } from "@/types/common/return-result";
import { TokenResponseDTO } from "@/types/helper/token-response-dto";
import Cookies from "js-cookie";
import { useRouter, useSearchParams } from "next/navigation";
import { useDispatch } from "react-redux";
import { toast } from "sonner";

export const useAuthTokenResult = () => {
    const dispatch = useDispatch();
    const router = useRouter();
    const searchParams = useSearchParams();

    const handleAuthTokenResult = (data: ReturnResult<TokenResponseDTO>, successMessage = "Login successfully!") => {
        if (data.moderationStatus?.isSuspended) {
            Cookies.remove("accessToken");
            Cookies.remove("refreshToken");
            dispatch(clearToken());
            sessionStorage.setItem("accountModerationStatus", JSON.stringify(data.moderationStatus));
            router.push("/account-suspended");
            return;
        }

        if (!data.result?.accessToken || !data.result.refreshToken) {
            return;
        }

        const parsedData = parseUserFromToken(data.result.accessToken);
        if (!parsedData) {
            toast.error("Invalid authentication token.");
            return;
        }

        dispatch(setToken({
            accessToken: data.result.accessToken,
            refreshToken: data.result.refreshToken,
            user: parsedData.user
        }));

        const isSecureContext = typeof window !== "undefined" && window.location.protocol === "https:";
        const cookieOptions = {
            expires: 7,
            secure: isSecureContext,
            sameSite: "lax" as const
        };

        Cookies.set("accessToken", data.result.accessToken, cookieOptions);
        Cookies.set("refreshToken", data.result.refreshToken, cookieOptions);

        toast.success(successMessage);

        const callbackUrl = searchParams.get("callbackUrl") || "/feed";
        router.push(callbackUrl);
    };

    return { handleAuthTokenResult };
};
