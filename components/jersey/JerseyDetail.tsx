import { Jersey } from "@/lib/types";
import { Badge } from "@/components/ui/Badge";
import { RatingStars } from "@/components/ui/RatingStars";
import { JerseyGrid } from "./JerseyGrid";
import Link from "next/link";

interface JerseyDetailViewProps {
  jersey: Jersey;
  related: Jersey[];
}

export function JerseyDetailView({ jersey, related }: JerseyDetailViewProps) {
  const hasImages = jersey.image_urls && jersey.image_urls.length > 0;
  const isGDrive = hasImages && jersey.image_urls[0]?.includes("drive.google.com");
  const showImage = hasImages && !isGDrive;

  const backHref = jersey.sport === "cricket" ? "/cricket" : "/football";
  const backLabel = jersey.sport === "cricket" ? "Cricket" : "Football";

  const metaItems = [
    { label: "Brand", value: jersey.brand },
    { label: "Sponsor", value: jersey.sponsor },
    { label: "Format", value: jersey.format },
    { label: "League", value: jersey.league },
    { label: "Nation", value: jersey.nation },
    { label: "Jersey Type", value: jersey.jersey_type },
    { label: "Primary Color", value: jersey.primary_color },
    jersey.cricket_board && { label: "Cricket Board", value: jersey.cricket_board },
    jersey.host_nation && { label: "Host Nation", value: jersey.host_nation },
    jersey.captain && { label: "Captain", value: jersey.captain },
    jersey.standing !== null && jersey.standing !== undefined && { label: "Standing", value: `#${jersey.standing}` },
  ].filter(Boolean) as { label: string; value: string }[];

  return (
    <div>
      {/* Breadcrumb */}
      <div className="max-w-7xl mx-auto px-4 pt-4 md:pt-6 pb-2">
        <div className="flex items-center gap-2 text-xs text-[#6B85A8] flex-wrap">
          <Link href="/" className="hover:text-[#2A4A7A] transition-colors">Home</Link>
          <span>/</span>
          <Link href={backHref} className="hover:text-[#2A4A7A] transition-colors">{backLabel}</Link>
          <span>/</span>
          <span className="text-[#2A4A7A]">{jersey.team} {jersey.season}</span>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6 md:py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6 lg:gap-12">
          {/* Image section */}
          <div className="space-y-4">
            <div className="aspect-[3/4] rounded-2xl overflow-hidden bg-gradient-to-br from-[#EAF0FF] to-[#FFFFFF] border border-[#C8D5EE]">
              {showImage ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={jersey.image_urls[0]}
                  alt={`${jersey.team} ${jersey.season} jersey`}
                  className="w-full h-full object-contain p-4"
                />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center gap-4 p-8 text-center">
                  <div className="w-20 h-20 rounded-full bg-[#C8D5EE] flex items-center justify-center">
                    <svg className="w-10 h-10 text-[#7A93B5]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <p className="text-sm text-[#6B85A8]">Image pending upload</p>
                  {hasImages && (
                    <p className="text-xs text-[#7A93B5]">Source: Google Drive</p>
                  )}
                </div>
              )}
            </div>

            {/* Second image if available */}
            {showImage && jersey.image_urls.length > 1 && (
              <div className="aspect-[3/2] rounded-xl overflow-hidden border border-[#C8D5EE]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={jersey.image_urls[1]}
                  alt={`${jersey.team} alternate view`}
                  className="w-full h-full object-contain p-3 bg-[#FFFFFF]"
                />
              </div>
            )}
          </div>

          {/* Info section */}
          <div className="space-y-6">
            <div>
              <div className="flex items-center gap-2 mb-2 flex-wrap">
                {jersey.tournament_won && <Badge variant="gold">Champion</Badge>}
                <Badge variant={jersey.sport === "cricket" ? "cricket" : "football"}>
                  {jersey.format}
                </Badge>
                <Badge variant="outline">{jersey.jersey_type}</Badge>
                {jersey.tags.includes("iconic") && <Badge variant="gold">Iconic</Badge>}
              </div>
              <h1 className="text-2xl md:text-3xl font-bold text-[#0F1E3D] leading-tight">{jersey.team}</h1>
              <p className="text-lg md:text-xl text-[#4A6FA5] mt-1">{jersey.season} Season</p>
            </div>

            {jersey.rating > 0 && (
              <div className="flex items-center gap-3">
                <RatingStars rating={jersey.rating} size="md" />
                <span className="text-sm text-[#4A6FA5]">{jersey.rating.toFixed(1)} / 5.0</span>
              </div>
            )}

            {jersey.design_description && (
              <div>
                <h3 className="text-xs font-semibold text-[#4A6FA5] uppercase tracking-widest mb-2">Design</h3>
                <p className="text-[#2A4A7A] leading-relaxed">{jersey.design_description}</p>
              </div>
            )}

            {jersey.worn_by && jersey.worn_by.length > 0 && (
              <div>
                <h3 className="text-xs font-semibold text-[#4A6FA5] uppercase tracking-widest mb-2">
                  Players Who Wore It
                </h3>
                <div className="flex flex-wrap gap-2">
                  {jersey.worn_by.map((player, i) => (
                    <Link
                      key={i}
                      href={`/search?q=${encodeURIComponent(player)}`}
                      className="text-sm text-[#2A4A7A] bg-[#EAF0FF] hover:bg-[#C8D5EE] border border-[#C8D5EE] px-3 py-1 rounded-lg transition-colors"
                    >
                      {player}
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* Meta grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {metaItems.map((item) =>
                item.value ? (
                  <div key={item.label} className="bg-[#FFFFFF] rounded-lg p-3 border border-[#C8D5EE]">
                    <p className="text-xs text-[#6B85A8] uppercase tracking-wider mb-1">{item.label}</p>
                    <p className="text-sm font-medium text-[#0F1E3D]">{item.value}</p>
                  </div>
                ) : null
              )}
            </div>

            {jersey.design_story && (
              <div className="bg-[#FFFFFF] rounded-xl p-5 border border-[#C8D5EE]">
                <h3 className="text-xs font-semibold text-[#2E5FBF] uppercase tracking-widest mb-3">
                  The Story Behind the Design
                </h3>
                <p className="text-sm text-[#2A4A7A] leading-relaxed">{jersey.design_story}</p>
              </div>
            )}

            {jersey.significance && (
              <div className="bg-[#EAF0FF] rounded-xl p-5 border border-[#1B3A7A]/30">
                <h3 className="text-xs font-semibold text-[#2E5FBF] uppercase tracking-widest mb-3">
                  Significance
                </h3>
                <p className="text-sm text-[#2A4A7A] leading-relaxed">{jersey.significance}</p>
              </div>
            )}

            {jersey.notable_matches && jersey.notable_matches.length > 0 && (
              <div>
                <h3 className="text-xs font-semibold text-[#4A6FA5] uppercase tracking-widest mb-2">
                  Notable Matches
                </h3>
                <ul className="space-y-2">
                  {jersey.notable_matches.map((match, i) => (
                    <li key={i} className="text-sm text-[#2A4A7A] flex items-start gap-2">
                      <span className="text-[#1B3A7A] mt-0.5">›</span>
                      {match}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>

        {/* Related jerseys */}
        {related.length > 0 && (
          <div className="mt-10 md:mt-16">
            <h2 className="text-lg md:text-xl font-bold text-[#0F1E3D] mb-4 md:mb-6">Related Jerseys</h2>
            <JerseyGrid jerseys={related} />
          </div>
        )}
      </div>
    </div>
  );
}
