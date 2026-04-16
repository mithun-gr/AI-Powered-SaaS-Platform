"use client";

import { useEffect, useRef } from "react";
import Lenis from "lenis";
import { useAccessibility } from "./accessibility-provider";

export function SmoothScrollProvider({ children }: { children: React.ReactNode }) {
    const { smoothScroll, stillness } = useAccessibility();
    const lenisRef = useRef<Lenis | null>(null);

    useEffect(() => {
        // If smooth scroll is disabled or reduced motion is enabled, do not initialize (or destroy if exists)
        if (!smoothScroll || stillness) {
            if (lenisRef.current) {
                lenisRef.current.destroy();
                lenisRef.current = null;
            }
            return;
        }

        // Initialize Lenis
        const lenis = new Lenis({
            duration: 1.2,
            easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
            orientation: "vertical",
            gestureOrientation: "vertical",
            smoothWheel: true,
            touchMultiplier: 2,
        });

        lenisRef.current = lenis;

        function raf(time: number) {
            lenis.raf(time);
            requestAnimationFrame(raf);
        }

        requestAnimationFrame(raf);

        return () => {
            lenis.destroy();
            lenisRef.current = null;
        };
    }, [smoothScroll, stillness]);

    return <>{children}</>;
}
