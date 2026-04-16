"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function RevenueChart() {
    const data = [
        { month: "Jan", value: 35, label: "$35k" },
        { month: "Feb", value: 42, label: "$42k" },
        { month: "Mar", value: 28, label: "$28k" },
        { month: "Apr", value: 45, label: "$45k" },
        { month: "May", value: 55, label: "$55k" },
        { month: "Jun", value: 68, label: "$68k" },
        { month: "Jul", value: 85, label: "$85k" },
    ];
    
    const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

    // Dynamic Y-Axis Scale Logic
    const maxDataValue = Math.max(...data.map(d => d.value));
    const maxAxis = Math.ceil(maxDataValue / 50) * 50 || 100; // Rounds up dynamically (e.g., 100k)
    const yAxisLabels = [maxAxis, maxAxis * 0.75, maxAxis * 0.5, maxAxis * 0.25, 0];

    return (
        <Card className="h-[380px] xl:h-full flex flex-col relative group shadow-[0_0_50px_-20px_hsl(var(--primary))] border-primary/20 bg-background/50 backdrop-blur-xl rounded-xl">
            {/* Ambient Base Glow */}
            <div className="absolute inset-0 bg-primary/5 blur-3xl opacity-30 pointer-events-none rounded-xl" />

            {/* Header with Feature 1: Hero Aggregation Metric */}
            <CardHeader className="relative z-10 pb-2">
                <div className="flex items-start justify-between">
                    <div>
                        <CardTitle className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest mb-1 opacity-80">Aggregate Revenue</CardTitle>
                        <div className="flex items-center gap-3 mt-1">
                            <span className="text-xl font-bold text-white tracking-tight drop-shadow-sm leading-none">$358,000</span>
                            <div className="px-1.5 py-0.5 bg-emerald-500/10 rounded-[4px] border border-emerald-500/20 font-semibold text-[9px] text-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.1)]">
                                +18.2%
                            </div>
                        </div>
                    </div>
                </div>
            </CardHeader>

            <CardContent className="relative z-10 p-0 flex-1 flex flex-col mt-4 pr-0">
                
                {/* Master Plot Frame (Expanded right margin prevents Tooltip Clipping) */}
                <div className="flex-1 relative ml-14 mr-10 sm:mr-14 mb-8 mt-12">
                    
                    {/* Feature 2: Y-Axis Stripe-Style Dynamic Scale */}
                    <div className="absolute inset-y-0 -left-12 w-10 flex flex-col justify-between text-[10px] font-bold text-white/50 pointer-events-none z-0 tracking-widest">
                        {yAxisLabels.map((val, i) => (
                            <span key={i} className={`leading-none ${i === 0 ? 'translate-y-1' : i === 4 ? '-translate-y-1' : i === 1 ? 'translate-y-1/2' : i === 3 ? '-translate-y-1/2' : ''}`}>
                                ${val}k
                            </span>
                        ))}
                    </div>

                    {/* Feature 4: Ultra-precise Frosted Glass Base-Plate */}
                    <div className="absolute bottom-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-white/10 to-transparent shadow-[0_1px_5px_rgba(255,255,255,0.2)] z-0" />
                    
                    {/* Architectural Localization Grid - Softened to remove noise */}
                    <div 
                        className="absolute inset-0 bg-[linear-gradient(to_right,hsl(var(--primary)/0.03)_1px,transparent_1px),linear-gradient(to_bottom,hsl(var(--primary)/0.03)_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none" 
                        style={{ maskImage: "linear-gradient(to top, black 20%, transparent 100%)", WebkitMaskImage: "linear-gradient(to top, black 20%, transparent 100%)" }} 
                    />

                    {/* Data Bar Absolute Nodes */}
                    {data.map((item, index) => {
                        const isHovered = hoveredIndex === index;
                        const isDimmed = hoveredIndex !== null && hoveredIndex !== index;
                        const leftPosition = (index / (data.length - 1)) * 100;

                        return (
                            <div 
                                key={item.month} 
                                className="absolute bottom-0 top-0 flex flex-col justify-end items-center group cursor-crosshair z-10 w-full max-w-[32px] sm:max-w-[40px]"
                                style={{ left: `${leftPosition}%`, transform: 'translateX(-50%)' }}
                                onPointerEnter={() => setHoveredIndex(index)}
                                onPointerLeave={() => setHoveredIndex(null)}
                            >
                                {/* Crosshair Tracking Line - Refined to zero-bleed dashed precision tracker */}
                                {isHovered && (
                                    <div 
                                        className="absolute w-[calc(100vw_-_100px)] border-t border-dashed border-primary/30 pointer-events-none z-[-1] hidden md:block" 
                                        style={{ bottom: `${item.value}%`, left: '50%', transform: "translateX(-50%)" }}
                                    />
                                )}

                                {/* Technical Precision Tooltip */}
                                <AnimatePresence>
                                    {isHovered && (
                                        <motion.div 
                                            initial={{ opacity: 0, y: 10, scale: 0.9 }}
                                            animate={{ opacity: 1, y: 0, scale: 1 }}
                                            exit={{ opacity: 0, y: 5, scale: 0.95 }}
                                            transition={{ duration: 0.2 }}
                                            className="absolute flex flex-col items-center pointer-events-none z-50"
                                            style={{ bottom: `calc(${item.value}% + 20px)`, left: '50%', transform: "translateX(-50%)" }}
                                        >
                                            <div className="bg-zinc-950 border border-zinc-800 shadow-2xl rounded-md py-1.5 px-3 flex flex-col items-center min-w-[70px]">
                                                <div className="text-[9px] text-primary font-bold uppercase tracking-widest mb-0.5">{item.month}</div>
                                                <div className="text-lg font-black text-white leading-none tracking-tight">{item.label}</div>
                                            </div>
                                            <div className="w-2.5 h-2.5 bg-zinc-950 border-b border-r border-zinc-800 rotate-45 -mt-[5.5px]" />
                                        </motion.div>
                                    )}
                                </AnimatePresence>

                                {/* 3D Poly-Glass Main Body */}
                                <motion.div
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: `${item.value}%`, opacity: isDimmed ? 0.3 : 1 }}
                                    transition={{ duration: 1.2, delay: index * 0.08, type: "spring", bounce: 0.3 }}
                                    className={`w-full relative overflow-visible flex flex-col items-center justify-start transition-all duration-300 rounded-t-[4px] ${
                                        isHovered ? 'shadow-[0_0_30px_hsl(var(--primary)/0.5)] ring-1 ring-primary/40' : 'shadow-none ring-0'
                                    }`}
                                    style={{
                                        background: isHovered 
                                            ? "linear-gradient(to top, hsl(var(--primary)/0.6), hsl(var(--primary)))"
                                            : "linear-gradient(to top, hsl(var(--primary)/0.6), hsl(var(--primary)/0.95))"
                                    }}
                                >
                                    {/* Razor Specular Rim */}
                                    <div className={`absolute top-0 left-0 right-0 h-[1.5px] transition-all rounded-t-[4px] ${isHovered ? 'bg-white shadow-[0_0_10px_white]' : 'bg-white/20'}`} />
                                    
                                    {/* Sweeping Loop core */}
                                    {isHovered && (
                                        <div className="absolute inset-0 overflow-hidden rounded-t-[4px] pointer-events-none">
                                            <motion.div 
                                                initial={{ y: "150%" }}
                                                animate={{ y: "-50%" }}
                                                transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }}
                                                className="absolute inset-0 bg-gradient-to-t from-transparent via-white/30 to-transparent w-full h-[50%]" 
                                            />
                                        </div>
                                    )}
                                </motion.div>

                                {/* Static X-Axis Plate Indicator */}
                                <div className="absolute -bottom-6 w-full flex justify-center">
                                    <span className={`text-[10px] font-bold tracking-widest uppercase transition-colors duration-300 ${isHovered ? 'text-primary drop-shadow-[0_0_8px_hsl(var(--primary))]' : 'text-muted-foreground/60'}`}>
                                        {item.month}
                                    </span>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </CardContent>
        </Card>
    );
}

// High-End Interactive Exploding Donut Chart
export function ServiceDistributionChart() {
    const services = [
        { name: "Legal", value: 380, strokeOpacity: 1 },
        { name: "Insurance", value: 250, strokeOpacity: 0.7 },
        { name: "Development", value: 130, strokeOpacity: 0.4 },
        { name: "Cloud", value: 95, strokeOpacity: 0.2 },
    ];

    const [hoveredData, setHoveredData] = useState<any | null>(null);
    const totalRequests = services.reduce((acc, curr) => acc + curr.value, 0);

    // Pre-calculate physical slices for geometric explosion physics
    let activeAccumulator = 0;
    const slices = services.map(item => {
        const percent = item.value / totalRequests;
        const startPercent = activeAccumulator;
        activeAccumulator += percent;
        return { ...item, percent, startPercent };
    });

    const radius = 38;
    const circumference = 2 * Math.PI * radius; 

    return (
        <Card className="h-full relative overflow-hidden group shadow-[0_0_50px_-20px_hsl(var(--primary))] border-primary/20 bg-background/50 backdrop-blur-xl flex flex-col">
            {/* Ambient Background Glow */}
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,hsl(var(--primary)/0.05),transparent_60%)] pointer-events-none" />
            
            <CardHeader className="relative z-10 pb-0 shrink-0">
                <CardTitle className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest opacity-80 mb-1">Category Breakdown</CardTitle>
                <div className="text-xl font-bold text-white tracking-tight leading-none">Service Distribution</div>
            </CardHeader>

            <CardContent className="relative z-10 flex-1 flex flex-col justify-center items-center mt-2 pb-6">
                
                {/* Visual Ring Container */}
                <div className="relative w-[200px] h-[200px] flex items-center justify-center shrink-0">
                    
                    {/* Exploding Donut Canvas */}
                    <svg viewBox="0 0 100 100" className="absolute inset-0 w-full h-full -rotate-90 drop-shadow-[0_0_15px_hsl(var(--primary)/0.3)] z-10 overflow-visible">
                        {slices.map((slice, index) => {
                            const isHovered = hoveredData && hoveredData.name === slice.name;
                            const isDimmed = hoveredData && hoveredData.name !== slice.name;
                            
                            const dashLength = slice.percent * circumference;
                            // Inject a micro-gap between arcs so they don't visually merge
                            const gap = 2.5; 
                            const activeDashLength = Math.max(0, dashLength - gap);

                            // Calculate 2D Cartesian explosion trajectory based on the arc's median angle
                            const globalAngle = (slice.startPercent + slice.percent / 2) * 2 * Math.PI;
                            const explodeDist = 6; // Max detached pixel distance
                            const dx = Math.cos(globalAngle) * explodeDist;
                            const dy = Math.sin(globalAngle) * explodeDist;

                            return (
                                <g key={slice.name} 
                                   className="cursor-crosshair"
                                   onPointerEnter={() => setHoveredData(slice)}
                                   onPointerLeave={() => setHoveredData(null)}
                                >
                                    {/* Glowing Detaching Slice */}
                                    <motion.circle
                                        initial={{ strokeDasharray: `0 ${circumference}`, rotate: slice.startPercent * 360, x: 0, y: 0 }}
                                        animate={{ 
                                            strokeDasharray: `${activeDashLength} ${circumference}`,
                                            rotate: slice.startPercent * 360,
                                            x: isHovered ? dx : 0,
                                            y: isHovered ? dy : 0,
                                            strokeWidth: isHovered ? 15 : 11,
                                            opacity: isHovered ? 1 : (isDimmed ? 0.05 : slice.strokeOpacity)
                                        }}
                                        transition={{ 
                                            strokeDasharray: { duration: 1.5, delay: index * 0.1, type: "spring", bounce: 0.1 },
                                            x: { duration: 0.35, type: "spring", bounce: 0.5 },
                                            y: { duration: 0.35, type: "spring", bounce: 0.5 },
                                            strokeWidth: { duration: 0.2 },
                                            opacity: { duration: 0.2 }
                                        }}
                                        style={{ transformOrigin: "50px 50px" }}
                                        cx="50" cy="50" r={radius}
                                        fill="none"
                                        stroke="hsl(var(--primary))"
                                        strokeLinecap="round"
                                        filter={isHovered ? "drop-shadow(0px 0px 8px hsl(var(--primary)))" : "drop-shadow(0px 2px 4px rgba(0,0,0,0.4))"}
                                    />
                                </g>
                            );
                        })}
                    </svg>
                    
                    {/* The Interactive Hollow Core */}
                    <AnimatePresence mode="wait">
                        <motion.div 
                            key={hoveredData ? hoveredData.name : 'total'}
                            initial={{ opacity: 0, scale: 0.8, filter: "blur(4px)" }}
                            animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
                            exit={{ opacity: 0, scale: 1.1, filter: "blur(4px)" }}
                            transition={{ duration: 0.2 }}
                            className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none z-0"
                        >
                            <div className="text-4xl font-black text-white tracking-tighter drop-shadow-md leading-none tabular-nums">
                                {hoveredData ? hoveredData.value : totalRequests}
                            </div>
                            <div 
                                className="text-[11px] font-extrabold tracking-widest uppercase mt-1.5 transition-colors duration-300" 
                                style={{ color: hoveredData ? 'hsl(var(--primary))' : 'rgba(255,255,255,0.8)' }}
                            >
                                {hoveredData ? hoveredData.name : 'Total Requests'}
                            </div>
                            
                            {/* Hover Badge */}
                            {hoveredData && (
                                <div className="text-[10px] font-black tracking-widest text-white mt-1.5 opacity-90 bg-white/10 px-2.5 py-0.5 rounded-full border border-white/10 shadow-inner">
                                    {((hoveredData.value / totalRequests) * 100).toFixed(1)}%
                                </div>
                            )}
                        </motion.div>
                    </AnimatePresence>
                </div>

                {/* Connected Legend 2x2 Structural Grid */}
                <div className="mt-8 grid grid-cols-2 gap-x-8 gap-y-3 shrink-0 z-20">
                    {services.map((item) => {
                        const isHovered = hoveredData && hoveredData.name === item.name;
                        return (
                            <div 
                                key={item.name} 
                                className={`flex items-center gap-2.5 group/legend cursor-pointer px-3 py-1.5 rounded-lg transition-all duration-300 ${
                                    isHovered ? 'bg-white/10 shadow-[0_4px_15px_rgba(0,0,0,0.3)] ring-1 ring-white/10 scale-105' : 'hover:bg-white/5 opacity-80 hover:opacity-100'
                                }`}
                                onPointerEnter={() => setHoveredData(item)}
                                onPointerLeave={() => setHoveredData(null)}
                            >
                                <div 
                                    className="w-2.5 h-2.5 rounded-full transition-all duration-300" 
                                    style={{ 
                                        backgroundColor: "hsl(var(--primary))",
                                        opacity: isHovered ? 1 : item.strokeOpacity,
                                        boxShadow: isHovered ? `0 0 12px hsl(var(--primary))` : 'none',
                                        transform: isHovered ? 'scale(1.5)' : 'scale(1)'
                                    }} 
                                />
                                <span className={`text-[11px] font-bold tracking-wider transition-colors duration-300 ${isHovered ? 'text-white' : 'text-muted-foreground'}`}>
                                    {item.name}
                                </span>
                            </div>
                        )
                    })}
                </div>
            </CardContent>
        </Card>
    );
}

import { AnimatePresence } from "framer-motion";

// Highly Animated Interactive User Growth Chart (Stock Market Style)
const rawDataSets: Record<string, { label: string; clients: number }[]> = {
    "1W": [
        { label: "Mon", clients: 1200 },
        { label: "Tue", clients: 1210 },
        { label: "Wed", clients: 1215 },
        { label: "Thu", clients: 1230 },
        { label: "Fri", clients: 1225 },
        { label: "Sat", clients: 1240 },
        { label: "Sun", clients: 1255 },
    ],
    "1M": [
        { label: "Week 1", clients: 1100 },
        { label: "Week 2", clients: 1150 },
        { label: "Week 3", clients: 1180 },
        { label: "Week 4", clients: 1255 },
    ],
    "6M": [
        { label: "Jan", clients: 450 },
        { label: "Feb", clients: 520 },
        { label: "Mar", clients: 480 },
        { label: "Apr", clients: 680 },
        { label: "May", clients: 720 },
        { label: "Jun", clients: 950 },
        { label: "Jul", clients: 1255 },
    ],
    "1Y": [
        { label: "Q1", clients: 250 },
        { label: "Q2", clients: 480 },
        { label: "Q3", clients: 850 },
        { label: "Q4", clients: 1255 },
    ],
    "ALL": [
        { label: "2022", clients: 30 },
        { label: "2023", clients: 50 },
        { label: "2024", clients: 350 },
        { label: "2025", clients: 900 },
        { label: "2026", clients: 1255 },
        
    ]
};

export function UserGrowthChart() {
    const periods = ["1W", "1M", "6M", "1Y", "ALL"];
    const [period, setPeriod] = useState("6M");
    const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

    const data = rawDataSets[period];

    // Auto-calculate entirely responsive fluid X and Y metrics with deep safe-zones.
    const maxVal = Math.max(...data.map(d => d.clients));
    const minVal = Math.min(...data.map(d => d.clients));
    
    const points = data.map((d, i) => {
        // Map X securely between 10% and 90% of the total card width.
        // This ensures the first and last labels ("Mon", "Sun") NEVER touch the sides.
        const xPercentage = data.length > 1 ? (i / (data.length - 1)) : 0.5;
        const x = 10 + (xPercentage * 80); 
        
        // Map Y securely between 35% and 75% height to provide MASSIVE vertical safety.
        // The highest point ("Sun") will not ever exceed 35% from the top ceiling.
        const range = maxVal - minVal === 0 ? 1 : maxVal - minVal;
        const normalized = (d.clients - minVal) / range;
        const y = 80 - (normalized * 45); // 0 -> 80% (Bottom), 1 -> 35% (Top)
        
        return { ...d, x, y };
    });

    const createPath = () => {
        let d = `M ${points[0].x},${points[0].y}`;
        for (let i = 0; i < points.length - 1; i++) {
            const curr = points[i];
            const next = points[i + 1];
            const cp1X = curr.x + (next.x - curr.x) / 2;
            d += ` C ${cp1X},${curr.y} ${cp1X},${next.y} ${next.x},${next.y}`;
        }
        return d;
    };

    const pathD = createPath();
    const fillD = `${pathD} V 100 H 0 Z`;

    const changePeriod = (p: string) => {
        setHoveredIndex(null);
        setPeriod(p);
    };

    return (
        <Card className="h-full relative overflow-hidden group shadow-[0_0_50px_-20px_hsl(var(--primary))] border-primary/20 bg-background/50 backdrop-blur-xl">
            {/* Ambient background pulse */}
            <div className="absolute inset-0 bg-primary/5 blur-3xl opacity-50 animate-pulse pointer-events-none" />
            
            <CardHeader className="relative z-10 pb-0">
                <div className="flex items-center justify-between">
                    <CardTitle className="text-xl font-bold text-white flex items-center">
                        Client Growth
                        <motion.span 
                            key={period}
                            initial={{ opacity: 0, y: 5 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="text-xs px-2 py-1 bg-green-500/20 text-green-400 rounded-full font-extrabold ml-3 shadow-[0_0_15px_rgba(34,197,94,0.3)] border border-green-500/30"
                        >
                            +{(Math.random() * 15).toFixed(1)}%
                        </motion.span>
                    </CardTitle>
                    {/* Interactive Tab Selectors */}
                    <div className="flex items-center bg-black/40 backdrop-blur-md p-1 rounded-lg border border-white/5 shadow-inner">
                        {periods.map(p => (
                            <button 
                                key={p} 
                                onClick={() => changePeriod(p)}
                                className={`text-xs px-3 py-1.5 rounded-md transition-all font-bold tracking-wide ${period === p ? 'bg-primary/90 text-white shadow-[0_0_15px_hsl(var(--primary)/0.5)]' : 'text-muted-foreground hover:bg-white/10 hover:text-white'}`}
                            >
                                {p}
                            </button>
                        ))}
                    </div>
                </div>
            </CardHeader>

            {/* Completely visible overflow ensures tooltips never choke on bounds */}
            <CardContent className="relative z-10 p-0 h-[240px] mt-4 overflow-visible">
                <AnimatePresence mode="popLayout">
                    <motion.div 
                        key={period}
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 1.05 }}
                        transition={{ duration: 0.4, type: "spring", bounce: 0.2 }}
                        className="h-full w-full relative touch-none select-none group/chart cursor-crosshair pb-4"
                        onPointerMove={(e) => {
                            const rect = e.currentTarget.getBoundingClientRect();
                            const xPos = e.clientX - rect.left; 
                            const width = rect.width; 
                            const percentage = (xPos / width) * 100;
                            
                            let closest = 0;
                            let minDiff = Infinity;
                            points.forEach((p, i) => {
                                const diff = Math.abs(p.x - percentage);
                                if (diff < minDiff) { minDiff = diff; closest = i; }
                            });
                            setHoveredIndex(closest);
                        }}
                        onPointerLeave={() => setHoveredIndex(null)}
                    >
                        {/* Scalable SVG Graphic */}
                        <div className="absolute inset-0">
                            <svg className="w-full h-full overflow-visible" viewBox="0 0 100 100" preserveAspectRatio="none">
                                <defs>
                                    <linearGradient id="glowFill" x1="0%" y1="0%" x2="0%" y2="100%">
                                        <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity="0.35" />
                                        <stop offset="50%" stopColor="hsl(var(--primary))" stopOpacity="0.05" />
                                        <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity="0" />
                                    </linearGradient>
                                    <filter id="neonGlow" x="-50%" y="-50%" width="200%" height="200%">
                                        <feGaussianBlur stdDeviation="2.5" result="coloredBlur"/>
                                        <feMerge>
                                            <feMergeNode in="coloredBlur"/>
                                            <feMergeNode in="SourceGraphic"/>
                                        </feMerge>
                                    </filter>
                                </defs>

                                <motion.path
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 1.2, ease: "easeOut" }}
                                    d={fillD}
                                    fill="url(#glowFill)"
                                    stroke="none"
                                />
                                
                                <motion.path
                                    initial={{ pathLength: 0 }}
                                    animate={{ pathLength: 1 }}
                                    transition={{ duration: 1.5, ease: "anticipate" }}
                                    d={pathD}
                                    fill="none"
                                    stroke="hsl(var(--primary))"
                                    strokeWidth="3"
                                    vectorEffect="non-scaling-stroke"
                                    filter="url(#neonGlow)"
                                />
                            </svg>
                        </div>

                        {/* Interactive UI Tooltip Layer */}
                        <div className="absolute inset-0">
                            {/* Tracking Dashed Line */}
                            {hoveredIndex !== null && (
                                <div 
                                    className="absolute top-[20%] bottom-8 pointer-events-none border-l-[1.5px] border-dashed border-white/10 transition-all duration-300"
                                    style={{ left: `${points[hoveredIndex].x}%` }}
                                />
                            )}

                            {points.map((point, i) => {
                                const isHovered = hoveredIndex === i;
                                return (
                                    <div key={i} className="absolute inset-0 pointer-events-none">
                                        <motion.div
                                            initial={{ opacity: 0, scale: 0 }}
                                            animate={{ opacity: 1, scale: isHovered ? 1.4 : 1 }}
                                            transition={{ delay: 0.1 + (i * 0.05), type: "spring", stiffness: 300, damping: 20 }}
                                            className={`absolute w-3 h-3 rounded-full border-[2px] -translate-x-1/2 -translate-y-1/2 transition-colors duration-200 z-10 ${
                                                isHovered ? "bg-white border-primary shadow-[0_0_20px_hsl(var(--primary))]" : "bg-card border-primary/60"
                                            }`}
                                            style={{ left: `${point.x}%`, top: `${point.y}%` }}
                                        />
                                        
                                        <div 
                                            className={`absolute -translate-x-1/2 text-[10px] font-bold uppercase tracking-widest transition-all duration-200 ${isHovered ? 'text-primary' : 'text-muted-foreground'}`}
                                            style={{ left: `${point.x}%`, bottom: `8px` }}
                                        >
                                            {point.label}
                                        </div>
                                    </div>
                                );
                            })}

                            {/* Precise & Sharp Technical Tooltip */}
                            {hoveredIndex !== null && (
                                <div 
                                    className="absolute pointer-events-none z-50 flex flex-col items-center"
                                    style={{ 
                                        left: `${points[hoveredIndex].x}%`, 
                                        top: `${points[hoveredIndex].y}%`,
                                        transform: "translate(-50%, -100%)",
                                        marginTop: "-12px"
                                    }}
                                >
                                    <div className="bg-zinc-900 border border-zinc-700 shadow-xl rounded-md py-1.5 px-3 flex flex-col items-center relative z-10 min-w-[80px]">
                                        <div className="text-[9px] text-zinc-400 font-bold uppercase tracking-widest mb-0.5">
                                            {points[hoveredIndex].label}
                                        </div>
                                        <div className="text-lg font-bold text-white leading-none tracking-tight">
                                            {points[hoveredIndex].clients}
                                        </div>
                                    </div>
                                    {/* Sharp precise arrow (rotated square with exactly matched borders) */}
                                    <div className="w-3 h-3 bg-zinc-900 border-b border-r border-zinc-700 rotate-45 -mt-[7px] z-0" />
                                </div>
                            )}
                        </div>
                    </motion.div>
                </AnimatePresence>
            </CardContent>
        </Card>
    );
}
