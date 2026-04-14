"use client";

import { useRouter, useSearchParams } from "next/navigation";

interface ExploreClientProps {
  total: number;
  from: number;
}

export function ExploreClient({ total, from }: ExploreClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const size = 24;
  const currentPage = Math.floor(from / size);
  const totalPages = Math.ceil(total / size);

  function goToPage(page: number) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("from", String(page * size));
    router.push(`?${params.toString()}`);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  return (
    <div className="flex items-center justify-center gap-2 flex-wrap">
      <button
        onClick={() => goToPage(currentPage - 1)}
        disabled={currentPage === 0}
        className="px-2 py-1 sm:px-3 sm:py-1.5 text-sm bg-[#FFFFFF] border border-[#C8D5EE] rounded-lg text-[#4A6FA5] hover:text-[#0F1E3D] disabled:opacity-30 transition-colors"
      >
        ← <span className="hidden sm:inline">Previous</span>
      </button>
      {Array.from({ length: Math.min(totalPages, 7) }).map((_, i) => {
        const page = i;
        return (
          <button
            key={page}
            onClick={() => goToPage(page)}
            className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
              page === currentPage
                ? "bg-[#1B3A7A] text-white font-semibold"
                : "bg-[#FFFFFF] border border-[#C8D5EE] text-[#4A6FA5] hover:text-[#0F1E3D]"
            }`}
          >
            {page + 1}
          </button>
        );
      })}
      <button
        onClick={() => goToPage(currentPage + 1)}
        disabled={currentPage >= totalPages - 1}
        className="px-2 py-1 sm:px-3 sm:py-1.5 text-sm bg-[#FFFFFF] border border-[#C8D5EE] rounded-lg text-[#4A6FA5] hover:text-[#0F1E3D] disabled:opacity-30 transition-colors"
      >
        <span className="hidden sm:inline">Next</span> →
      </button>
    </div>
  );
}
