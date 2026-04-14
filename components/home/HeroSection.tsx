"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import Link from "next/link";

export function HeroSection() {
  const router = useRouter();
  const [search, setSearch] = useState("");

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (search.trim()) {
      router.push(`/search?q=${encodeURIComponent(search.trim())}`);
    }
  };

  return (
    <section className="relative min-h-[80vh] md:min-h-[85vh] flex items-center justify-center overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#EAF0FF] via-[#dce8ff] to-[#F4F6FB]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(27,58,122,0.08)_0%,transparent_60%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_right,rgba(46,95,191,0.06)_0%,transparent_50%)]" />

      {/* Grid pattern */}
      <div className="absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage: `linear-gradient(rgba(27,58,122,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(27,58,122,0.3) 1px, transparent 1px)`,
          backgroundSize: "60px 60px",
        }}
      />

      <div className="relative z-10 text-center px-4 max-w-4xl mx-auto">
        <div className="inline-flex items-center gap-2 bg-[#1B3A7A]/10 border border-[#1B3A7A]/30 text-[#2E5FBF] text-xs px-3 py-1.5 rounded-full mb-4 md:mb-6 uppercase tracking-widest">
          <span className="w-1.5 h-1.5 bg-[#1B3A7A] rounded-full animate-pulse" />
          The Definitive Jersey Archive
        </div>

        <h1 data-testid="hero-headline" className="text-4xl sm:text-5xl md:text-7xl font-extrabold tracking-tight mb-4 md:mb-6 leading-none">
          <span className="text-[#0F1E3D]">Every Kit.</span>
          <br />
          <span className="text-[#0F1E3D]">Every </span>
          <span className="gradient-text">Story</span>
          <span className="text-[#0F1E3D]">.</span>
        </h1>

        <p className="text-[#4A6FA5] text-base md:text-xl max-w-2xl mx-auto mb-7 md:mb-10 leading-relaxed">
          Explore 400+ football and cricket jerseys — from iconic IPL kits to
          Champions League legends. Archive, rate, and discover the history
          stitched into every jersey.
        </p>

        {/* Search */}
        <form onSubmit={handleSearch} className="flex gap-2 md:gap-3 max-w-lg mx-auto mb-7 md:mb-10">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by team, player, season..."
            className="flex-1 bg-[#FFFFFF] border border-[#C8D5EE] rounded-xl px-4 md:px-5 py-3 md:py-3.5 text-[#0F1E3D] placeholder-gray-500 focus:outline-none focus:border-yellow-500/50 focus:ring-1 focus:ring-yellow-500/20 transition-colors text-sm md:text-base"
          />
          <button
            type="submit"
            className="bg-[#1B3A7A] hover:bg-[#122B5F] text-white font-bold px-4 md:px-6 py-3 md:py-3.5 rounded-xl transition-colors text-sm md:text-base shrink-0 min-w-[72px]"
          >
            Search
          </button>
        </form>

        {/* Sport selector */}
        <div className="flex items-center justify-center gap-2 md:gap-4 flex-wrap">
          <Link
            href="/cricket"
            className="group flex items-center gap-2 md:gap-3 bg-[#FFFFFF] hover:bg-[#EAF0FF] border border-[#C8D5EE] hover:border-emerald-500/40 px-4 md:px-6 py-3 md:py-4 rounded-xl transition-all duration-300"
          >
            <span className="text-xl md:text-2xl">🏏</span>
            <div className="text-left">
              <div className="text-sm font-semibold text-[#0F1E3D] group-hover:text-emerald-400 transition-colors">Cricket</div>
              <div className="text-xs text-[#6B85A8] hidden sm:block">IPL · T20 · ODI</div>
            </div>
          </Link>
          <Link
            href="/football"
            className="group flex items-center gap-2 md:gap-3 bg-[#FFFFFF] hover:bg-[#EAF0FF] border border-[#C8D5EE] hover:border-blue-500/40 px-4 md:px-6 py-3 md:py-4 rounded-xl transition-all duration-300"
          >
            <span className="text-xl md:text-2xl">⚽</span>
            <div className="text-left">
              <div className="text-sm font-semibold text-[#0F1E3D] group-hover:text-blue-400 transition-colors">Football</div>
              <div className="text-xs text-[#6B85A8] hidden sm:block">UCL · Premier League</div>
            </div>
          </Link>
          <Link
            href="/explore"
            className="group flex items-center gap-2 md:gap-3 bg-[#FFFFFF] hover:bg-[#EAF0FF] border border-[#C8D5EE] hover:border-[#1B3A7A]/50 px-4 md:px-6 py-3 md:py-4 rounded-xl transition-all duration-300"
          >
            <span className="text-xl md:text-2xl">🔍</span>
            <div className="text-left">
              <div className="text-sm font-semibold text-[#0F1E3D] group-hover:text-[#2E5FBF] transition-colors">Explore</div>
              <div className="text-xs text-[#6B85A8] hidden sm:block">All sports</div>
            </div>
          </Link>
        </div>
      </div>
    </section>
  );
}
