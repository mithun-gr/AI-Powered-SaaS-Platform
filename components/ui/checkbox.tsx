"use client"

import * as React from "react"
import { Check } from "lucide-react"
import { cn } from "@/lib/utils"

export interface CheckboxProps {
  checked?: boolean
  onCheckedChange?: (checked: boolean) => void
  disabled?: boolean
  className?: string
  id?: string
}

import { motion, AnimatePresence } from "framer-motion"

export function Checkbox({ checked = false, onCheckedChange, disabled, className, id }: CheckboxProps) {
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onCheckedChange?.(!checked)}
      className={cn(
        "peer h-5 w-5 shrink-0 rounded-md border-2 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 transition-all duration-300 ease-out",
        "flex items-center justify-center relative overflow-hidden",
        checked 
          ? "bg-primary border-primary text-primary-foreground shadow-[0_0_15px_rgba(235,94,40,0.6)]" 
          : "bg-transparent border-muted-foreground/40 hover:border-primary hover:shadow-[0_0_8px_rgba(235,94,40,0.4)]",
        className
      )}
      id={id}
    >
      <AnimatePresence>
        {checked && (
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
            className="flex items-center justify-center"
          >
            <Check className="h-3.5 w-3.5 stroke-[3.5]" />
          </motion.div>
        )}
      </AnimatePresence>
      {/* Ripple effect container */}
      {checked && (
        <motion.div
            className="absolute inset-0 bg-white/20"
            initial={{ scale: 0, opacity: 0.5 }}
            animate={{ scale: 1.5, opacity: 0 }}
            transition={{ duration: 0.4 }}
        />
      )}
    </button>
  )
}
