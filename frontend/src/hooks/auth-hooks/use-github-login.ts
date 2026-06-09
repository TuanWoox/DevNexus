import { toast } from "sonner";

const createState = () => {
    const bytes = new Uint8Array(16);
    crypto.getRandomValues(bytes);
    return Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
};

const useGithubLogin = () => {
    const login = () => {
        const clientId = process.env.NEXT_PUBLIC_GITHUB_CLIENT_ID;
        const redirectUri = process.env.NEXT_PUBLIC_GITHUB_REDIRECT_URI;

        if (!clientId || !redirectUri) {
            toast.error("GitHub OAuth is not configured.");
            return;
        }

        const state = createState();
        sessionStorage.setItem("github_oauth_state", state);

        const url = new URL("https://github.com/login/oauth/authorize");
        url.searchParams.set("client_id", clientId);
        url.searchParams.set("redirect_uri", redirectUri);
        url.searchParams.set("scope", "read:user user:email");
        url.searchParams.set("state", state);

        window.location.href = url.toString();
    };

    return { login };
};

export default useGithubLogin;
