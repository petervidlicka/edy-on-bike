import { useRef, useEffect } from "react";

export function useCheatCode(code: string, onActivate: () => void) {
    const bufferRef = useRef("");

    useEffect(() => {
        const handler = (e: KeyboardEvent) => {
            bufferRef.current += e.key.toUpperCase();
            if (bufferRef.current.length > code.length) {
                bufferRef.current = bufferRef.current.slice(-code.length);
            }
            if (bufferRef.current === code) {
                bufferRef.current = "";
                onActivate();
            }
        };
        window.addEventListener("keydown", handler);
        return () => window.removeEventListener("keydown", handler);
    }, [code, onActivate]);
}
