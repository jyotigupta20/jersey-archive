"use client";
import { cn } from "@/lib/utils";
import { InputHTMLAttributes } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export function Input({ label, error, className, ...props }: InputProps) {
  return (
    <div className="flex flex-col gap-1">
      {label && (
        <label className="text-xs font-medium text-[#4A6FA5] uppercase tracking-wider">
          {label}
        </label>
      )}
      <input
        className={cn(
          "bg-[#FFFFFF] border border-[#C8D5EE] rounded-lg px-3 py-2 text-sm text-[#0F1E3D] placeholder-gray-500",
          "focus:outline-none focus:border-yellow-500/50 focus:ring-1 focus:ring-yellow-500/20",
          "transition-colors duration-200",
          error && "border-red-500/50",
          className
        )}
        {...props}
      />
      {error && <p className="text-xs text-red-400">{error}</p>}
    </div>
  );
}
