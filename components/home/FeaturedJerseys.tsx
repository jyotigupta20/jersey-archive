import Link from "next/link";
import { Jersey } from "@/lib/types";
import { JerseyGrid } from "@/components/jersey/JerseyGrid";

interface FeaturedJerseysProps {
  jerseys: Jersey[];
  title?: string;
  viewAllHref?: string;
}

export function FeaturedJerseys({ jerseys, title = "Featured Jerseys", viewAllHref = "/explore" }: FeaturedJerseysProps) {
  return (
    <section className="py-8 md:py-14">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-end justify-between mb-5 md:mb-8">
          <div>
            <p className="text-xs text-[#1B3A7A] uppercase tracking-widest mb-1 md:mb-2">Top Rated</p>
            <h2 className="text-xl md:text-2xl font-bold text-[#0F1E3D]">{title}</h2>
          </div>
          <Link
            href={viewAllHref}
            className="text-sm text-[#4A6FA5] hover:text-[#2E5FBF] transition-colors flex items-center gap-1 shrink-0"
          >
            View all
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </div>
        <JerseyGrid jerseys={jerseys} />
      </div>
    </section>
  );
}
