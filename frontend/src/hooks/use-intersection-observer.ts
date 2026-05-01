import { useEffect, useRef } from 'react';

/**
 * Fires `onIntersect` whenever the returned `ref` element enters the viewport.
 * Use this to trigger infinite scroll by attaching the ref to a sentinel div
 * at the bottom of a list.
 */
export function useIntersectionObserver(
    onIntersect: () => void,
    threshold = 0.1
) {
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const el = ref.current;
        if (!el) return;

        const observer = new IntersectionObserver((entries) => {
            if (entries[0].isIntersecting) {
                onIntersect();
            }
        }, { threshold });

        observer.observe(el);
        return () => observer.disconnect();
    }, [onIntersect, threshold]);

    return ref;
}
