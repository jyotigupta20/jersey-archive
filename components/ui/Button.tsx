"use client";
import { cn } from "@/lib/utils";
import { ButtonHTMLAttributes } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost" | "outline";
  size?: "sm" | "md" | "lg";
}

export function Button({
  children,
  variant = "primary",
  size = "md",
  className,
  ...props
}: ButtonProps) {
  const variants = {
    primary: "bg-[#1B3A7A] text-white font-semibold hover:bg-[#122B5F]",
    secondary: "bg-[#EAF0FF] text-[#0F1E3D] hover:bg-[#C8D5EE] border border-[#C8D5EE]",
    ghost: "text-[#4A6FA5] hover:text-[#0F1E3D] hover:bg-[#EAF0FF]",
    outline: "border border-[#C8D5EE] text-[#2A4A7A] hover:border-gray-500 hover:text-[#0F1E3D]",
  };

  const sizes = {
    sm: "px-3 py-1.5 text-sm",
    md: "px-4 py-2 text-sm",
    lg: "px-6 py-3 text-base",
  };

  return (
    <button
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-lg transition-all duration-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed",
        variants[variant],
        sizes[size],
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}
