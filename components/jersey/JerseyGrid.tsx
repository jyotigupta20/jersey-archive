import { Jersey } from "@/lib/types";
import { JerseyCard } from "./JerseyCard";

interface JerseyGridProps {
  jerseys: Jersey[];
  emptyMessage?: string;
}

export function JerseyGrid({ jerseys, emptyMessage = "No jerseys found" }: JerseyGridProps) {
  if (jerseys.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="w-16 h-16 rounded-full bg-[#FFFFFF] flex items-center justify-center mb-4">
          <svg className="w-8 h-8 text-[#7A93B5]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <p className="text-[#6B85A8]">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div data-testid="jersey-grid" className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
      {jerseys.map((jersey) => (
        <JerseyCard key={jersey.id} jersey={jersey} />
      ))}
    </div>
  );
}
