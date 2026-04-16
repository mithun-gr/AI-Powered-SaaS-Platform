import React from "react";
import { cn } from "@/lib/utils";

type StatusType = "new" | "in-progress" | "waiting" | "completed" | "paid" | "pending" | "overdue";

interface StatusBadgeProps {
    status: StatusType;
    className?: string;
}

const statusConfig: Record<StatusType, { label: string; className: string }> = {
    new: {
        label: "New",
        className: "bg-primary/20 text-primary border-primary animate-pulse",
    },
    "in-progress": {
        label: "In Progress",
        className: "bg-yellow-500/20 text-yellow-500 border-yellow-500",
    },
    waiting: {
        label: "Waiting",
        className: "bg-orange-500/20 text-orange-500 border-orange-500",
    },
    completed: {
        label: "Completed",
        className: "bg-green-500/20 text-green-500 border-green-500",
    },
    paid: {
        label: "Paid",
        className: "bg-green-500/20 text-green-500 border-green-500",
    },
    pending: {
        label: "Pending",
        className: "bg-orange-500/20 text-orange-500 border-orange-500",
    },
    overdue: {
        label: "Overdue",
        className: "bg-red-500/20 text-red-500 border-red-500",
    },
};

export function StatusBadge({ status, className }: StatusBadgeProps) {
    const config = statusConfig[status];

    return (
        <span
            className={cn(
                "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border",
                config.className,
                className
            )}
        >
            {config.label}
        </span>
    );
}
