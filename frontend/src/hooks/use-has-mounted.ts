"use client";

import { useState, useEffect } from "react";

/**
 * A hook to detect if the component has mounted on the client.
 * Essential for components that rely on client-only state (Redux, localStorage, etc.)
 * during initial hydration to avoid SSR mismatch.
 */
export function useHasMounted() {
    const [hasMounted, setHasMounted] = useState(false);

    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setHasMounted(true);
    }, []);

    return hasMounted;
}
