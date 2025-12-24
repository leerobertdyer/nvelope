import { useEffect } from "react";

export function useDisableNumberScroll() {
    useEffect(() => {
        const handler = () => {
            const el = document.activeElement;

            if (el instanceof HTMLInputElement && el.type === "number") {
                el.blur();
            }
        };

        document.addEventListener("wheel", handler, { passive: true });
        return () => document.removeEventListener("wheel", handler);
    }, []);
}
