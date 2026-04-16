"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";

interface AccessibilityContextType {
    simpleFont: boolean;
    toggleSimpleFont: () => void;
    scaleLevel: number;
    setScaleLevel: (level: number) => void;
    eyeCare: boolean;
    toggleEyeCare: () => void;
    vividMode: boolean;
    toggleVividMode: () => void;
    stillness: boolean;
    toggleStillness: () => void;
    highlightFocus: boolean;
    toggleHighlightFocus: () => void;
    smoothScroll: boolean;
    toggleSmoothScroll: () => void;
    resetPreferences: () => void;
}

const AccessibilityContext = createContext<AccessibilityContextType | undefined>(undefined);

export function AccessibilityProvider({ children }: { children: ReactNode }) {
    const [simpleFont, setSimpleFont] = useState(false);
    const [scaleLevel, setScaleLevel] = useState(1); // 0.8, 1, 1.2, 1.4
    const [eyeCare, setEyeCare] = useState(false);
    const [vividMode, setVividMode] = useState(false);
    const [stillness, setStillness] = useState(false);
    const [highlightFocus, setHighlightFocus] = useState(false);
    const [smoothScroll, setSmoothScroll] = useState(false);

    // Apply preferences to HTML root
    useEffect(() => {
        const root = document.documentElement;

        // Simple Font
        if (simpleFont) root.setAttribute("data-font", "simple");
        else root.removeAttribute("data-font");

        // Scale Level (Apply as CSS variable for global scaling)
        // Levels: 0=Small(0.9), 1=Normal(1), 2=Large(1.15), 3=Extra(1.3)
        const scales = [0.9, 1, 1.15, 1.3];
        root.style.setProperty("--app-scale", String(scales[scaleLevel]));
        // Also apply text-size-adjust to body
        // document.body.style.fontSize = `${scales[scaleLevel]}rem`; // This approach is tricky with REMs. 
        // Better: Use a zoom transform or CSS variable monitoring.
        // Let's rely on --app-scale usage in globals.css

        // Eye Care
        if (eyeCare) root.setAttribute("data-eyecare", "true");
        else root.removeAttribute("data-eyecare");

        // Vivid Mode
        if (vividMode) root.setAttribute("data-theme-style", "vivid");
        else root.removeAttribute("data-theme-style");

        // Stillness
        if (stillness) root.setAttribute("data-motion", "reduced");
        else root.removeAttribute("data-motion");

        // Highlight Focus
        if (highlightFocus) root.setAttribute("data-focus", "visible");
        else root.removeAttribute("data-focus");

    }, [simpleFont, scaleLevel, eyeCare, vividMode, stillness, highlightFocus]);

    const resetPreferences = () => {
        setSimpleFont(false);
        setScaleLevel(1);
        setEyeCare(false);
        setVividMode(false);
        setStillness(false);
        setHighlightFocus(false);
        setSmoothScroll(false);
    };

    return (
        <AccessibilityContext.Provider
            value={{
                simpleFont,
                toggleSimpleFont: () => setSimpleFont(!simpleFont),
                scaleLevel,
                setScaleLevel,
                eyeCare,
                toggleEyeCare: () => setEyeCare(!eyeCare),
                vividMode,
                toggleVividMode: () => setVividMode(!vividMode),
                stillness,
                toggleStillness: () => setStillness(!stillness),
                highlightFocus,
                toggleHighlightFocus: () => setHighlightFocus(!highlightFocus),
                smoothScroll,
                toggleSmoothScroll: () => setSmoothScroll(!smoothScroll),
                resetPreferences,
            }}
        >
            {children}
            {/* Eye Care Overlay */}
            {eyeCare && (
                <div className="fixed inset-0 pointer-events-none z-[9999] bg-orange-600/25 mix-blend-multiply backdrop-brightness-90 transition-all duration-500 block" />
            )}
        </AccessibilityContext.Provider>
    );
}

export function useAccessibility() {
    const context = useContext(AccessibilityContext);
    if (context === undefined) {
        throw new Error("useAccessibility must be used within an AccessibilityProvider");
    }
    return context;
}
