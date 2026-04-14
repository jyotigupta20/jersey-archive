"use client";

interface RatingStarsProps {
  rating: number;
  size?: "sm" | "md";
}

export function RatingStars({ rating, size = "sm" }: RatingStarsProps) {
  const full = Math.floor(rating);
  const half = rating % 1 >= 0.5;
  const empty = 5 - full - (half ? 1 : 0);

  const textSize = size === "sm" ? "text-xs" : "text-sm";

  return (
    <span className={`${textSize} text-[#1B3A7A]`} title={`${rating}/5`}>
      {"★".repeat(full)}
      {half && "½"}
      <span className="text-[#7A93B5]">{"☆".repeat(empty)}</span>
    </span>
  );
}
