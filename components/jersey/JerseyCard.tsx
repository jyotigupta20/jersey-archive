"use client";

import Link from "next/link";
import { Jersey } from "@/lib/types";
import { RatingStars } from "@/components/ui/RatingStars";
import { Badge } from "@/components/ui/Badge";

interface JerseyCardProps {
  jersey: Jersey;
}

export function JerseyCard({ jersey }: JerseyCardProps) {
  const hasImage = jersey.image_urls && jersey.image_urls.length > 0;
  const isGDrive = hasImage && jersey.image_urls[0]?.includes("drive.google.com");

  return (
    <Link
      data-testid="jersey-card"
      href={`/${jersey.sport}/${jersey.id}`}
      className="group relative bg-[#FFFFFF] rounded-xl overflow-hidden border border-[#C8D5EE] hover:border-[#A8BDD8] transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl hover:shadow-black/40 block"
    >
      {/* Image area */}
      <div className="relative aspect-[3/4] overflow-hidden bg-gradient-to-br from-[#EAF0FF] to-[#FFFFFF]">
        {hasImage && !isGDrive ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={jersey.image_urls[0]}
            alt={`${jersey.team} ${jersey.season} jersey`}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center gap-3 p-4">
            <div className="w-16 h-16 rounded-full bg-[#C8D5EE] flex items-center justify-center">
              <svg className="w-8 h-8 text-[#7A93B5]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <span className="text-xs text-[#7A93B5] text-center leading-tight">{jersey.team}</span>
          </div>
        )}

        {/* Overlay on hover */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

        {/* View Details CTA */}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <span className="bg-[#1B3A7A] text-white text-xs font-bold px-3 py-1.5 rounded-lg uppercase tracking-wider">
            View Details
          </span>
        </div>

        {/* Top badges */}
        <div className="absolute top-2 left-2 flex flex-col gap-1">
          {jersey.tournament_won && (
            <Badge variant="gold">Champion</Badge>
          )}
          {jersey.sport === "cricket" ? (
            <Badge variant="cricket">{jersey.format}</Badge>
          ) : (
            <Badge variant="football">{jersey.format}</Badge>
          )}
        </div>
      </div>

      {/* Info */}
      <div className="p-2.5 md:p-3">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <h3 className="font-semibold text-xs md:text-sm text-[#0F1E3D] truncate leading-tight">
              {jersey.team}
            </h3>
            <p className="text-[10px] md:text-xs text-[#6B85A8] mt-0.5">
              {jersey.season} · {jersey.jersey_type}
            </p>
          </div>
          <div className="flex-shrink-0">
            <RatingStars rating={jersey.rating} />
          </div>
        </div>

        {jersey.brand && (
          <p className="text-[10px] md:text-xs text-[#7A93B5] mt-1 md:mt-1.5 uppercase tracking-wider">{jersey.brand}</p>
        )}
      </div>
    </Link>
  );
}
