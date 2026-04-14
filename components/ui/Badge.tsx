"use client";
import { cn } from "@/lib/utils";

interface BadgeProps {
  children: React.ReactNode;
  variant?: "default" | "gold" | "football" | "cricket" | "outline";
  className?: string;
}

export function Badge({ children, variant = "default", className }: BadgeProps) {
  const variants = {
    default: "bg-[#C8D5EE] text-[#2A4A7A]",
    gold: "bg-[#1B3A7A]/20 text-[#2E5FBF] border border-[#1B3A7A]/40",
    football: "bg-blue-500/20 text-blue-400 border border-blue-500/30",
    cricket: "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30",
    outline: "border border-[#C8D5EE] text-[#4A6FA5]",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center px-2 py-0.5 rounded text-xs font-medium uppercase tracking-wider",
        variants[variant],
        className
      )}
    >
      {children}
    </span>
  );
}
