"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence, useDragControls } from "framer-motion";
import { 
    Eye, 
    Type, 
    Monitor, 
    Zap, 
    Move, 
    ScanEye, 
    X, 
    RotateCcw,
    Settings2,
    Mouse
} from "lucide-react";
import { useAccessibility } from "./providers/accessibility-provider";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function AccessibilityPanel() {
    const [isOpen, setIsOpen] = useState(false);
    const [isDragging, setIsDragging] = useState(false);
    const [mounted, setMounted] = useState(false);
    const dragButtonRef = useRef(null);

    useEffect(() => {
        setMounted(true);
    }, []);
    const {
        simpleFont, toggleSimpleFont,
        scaleLevel, setScaleLevel,
        eyeCare, toggleEyeCare,
        vividMode, toggleVividMode,
        stillness, toggleStillness,
        highlightFocus, toggleHighlightFocus,
        smoothScroll, toggleSmoothScroll,
        resetPreferences
    } = useAccessibility();

    // Features config
    const features = [
        {
            label: "Simple Type",
            icon: Type,
            active: simpleFont,
            toggle: toggleSimpleFont,
            desc: "Enhanced readability"
        },
        {
            label: "Eye Care",
            icon: Eye,
            active: eyeCare,
            toggle: toggleEyeCare,
            desc: "Warm screen filter"
        },
        {
            label: "Vivid Mode",
            icon: Monitor,
            active: vividMode,
            toggle: toggleVividMode,
            desc: "High contrast visuals"
        },
        {
            label: "Stillness",
            icon: Move,
            active: stillness,
            toggle: toggleStillness,
            desc: "Reduce motion"
        },
        {
            label: "Highlight Focus",
            icon: ScanEye,
            active: highlightFocus,
            toggle: toggleHighlightFocus,
            desc: "Clear focus indicators"
        },
        {
            label: "Smooth Scroll",
            icon: Mouse,
            active: smoothScroll,
            toggle: toggleSmoothScroll,
            desc: "Premium inertial scrolling"
        },
    ];

    return (
        <>
            {mounted && (
                <button
                    onClick={() => setIsOpen(true)}
                    className="w-full group flex items-center px-3 py-2.5 text-sm font-medium rounded-md transition-all text-gray-400 hover:bg-secondary hover:text-white"
                >
                    <Settings2 className="mr-3 flex-shrink-0 h-5 w-5 text-gray-400 group-hover:text-white" />
                    Display
                </button>
            )}

            {/* Panel Drawer */}
            <AnimatePresence>
                {isOpen && (
                    <>
                        {/* Backdrop */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsOpen(false)}
                            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50"
                        />

                        {/* Drawer */}
                        <motion.div
                            initial={{ x: "-100%" }}
                            animate={{ x: 0 }}
                            exit={{ x: "-100%" }}
                            transition={{ type: "spring", damping: 30, stiffness: 300 }}
                            className="fixed left-0 top-0 bottom-0 z-50 w-80 bg-card/50 backdrop-blur-xl border-r border-primary/20 shadow-2xl overflow-y-auto"
                        >
                            <div className="p-6 h-full flex flex-col">
                                {/* Header */}
                                <div className="flex items-center justify-between mb-8">
                                    <div>
                                        <h2 className="text-xl font-bold flex items-center gap-2">
                                            <Zap className="h-5 w-5 text-primary" />
                                            Viewing
                                        </h2>
                                        <p className="text-xs text-muted-foreground">Customize your experience</p>
                                    </div>
                                    <Button 
                                        variant="ghost" 
                                        size="icon" 
                                        onClick={() => setIsOpen(false)}
                                        className="rounded-full hover:bg-primary/20"
                                    >
                                        <X className="h-5 w-5" />
                                    </Button>
                                </div>

                                {/* Scaling Slider Content */}
                                <div className="mb-8 p-4 rounded-xl bg-secondary/30 border border-primary/10">
                                    <div className="flex justify-between items-center mb-4">
                                        <span className="text-sm font-medium">Content Scale</span>
                                        <span className="text-xs px-2 py-0.5 rounded-full bg-primary/20 text-primary">
                                            {scaleLevel === 0 ? "90%" : scaleLevel === 1 ? "100%" : scaleLevel === 2 ? "115%" : "130%"}
                                        </span>
                                    </div>
                                    <div className="relative h-2 bg-secondary rounded-full overflow-hidden">
                                        <div 
                                            className="absolute left-0 top-0 h-full bg-primary transition-all duration-300"
                                            style={{ width: `${(scaleLevel / 3) * 100}%` }}
                                        />
                                    </div>
                                    <div className="flex justify-between mt-4">
                                        {[0, 1, 2, 3].map((level) => (
                                            <button
                                                key={level}
                                                onClick={() => setScaleLevel(level)}
                                                className={cn(
                                                    "h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold transition-all border-2",
                                                    scaleLevel === level
                                                        ? "border-primary bg-primary text-primary-foreground scale-110"
                                                        : "border-transparent bg-secondary text-muted-foreground hover:bg-secondary/80"
                                                )}
                                            >
                                                {level === 0 ? "A" : level === 3 ? "A+" : "A"}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Feature Grid */}
                                <div className="grid grid-cols-1 gap-3 mb-auto">
                                    {features.map((feature) => (
                                        <button
                                            key={feature.label}
                                            onClick={feature.toggle}
                                            className={cn(
                                                "flex items-center gap-4 p-4 rounded-xl transition-all border text-left",
                                                feature.active
                                                    ? "bg-primary/10 border-primary shadow-[0_0_15px_-3px_rgba(239,68,68,0.3)]"
                                                    : "bg-secondary/10 border-transparent hover:bg-secondary/30 hover:border-primary/10"
                                            )}
                                        >
                                            <div className={cn(
                                                "p-2 rounded-lg transition-colors",
                                                feature.active ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground"
                                            )}>
                                                <feature.icon className="h-5 w-5" />
                                            </div>
                                            <div>
                                                <p className={cn(
                                                    "font-medium transition-colors",
                                                    feature.active ? "text-primary" : "text-foreground"
                                                )}>
                                                    {feature.label}
                                                </p>
                                                <p className="text-xs text-muted-foreground">{feature.desc}</p>
                                            </div>
                                            <div className={cn(
                                                "ml-auto h-3 w-3 rounded-full transition-all",
                                                feature.active ? "bg-primary shadow-[0_0_10px_rgba(239,68,68,0.8)]" : "bg-muted"
                                            )} />
                                        </button>
                                    ))}
                                </div>

                                {/* Reset Button */}
                                <Button 
                                    variant="outline" 
                                    onClick={resetPreferences}
                                    className="mt-6 w-full gap-2 border-dashed hover:border-primary hover:text-primary hover:bg-transparent"
                                >
                                    <RotateCcw className="h-4 w-4" />
                                    Reset to Defaults
                                </Button>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </>
    );
}
