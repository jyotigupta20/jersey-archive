"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { useState, useRef, useEffect } from "react";

export function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const timer = setTimeout(async () => {
      if (search.length >= 2) {
        const res = await fetch(`/api/search/suggest?q=${encodeURIComponent(search)}`);
        if (res.ok) {
          const data = await res.json();
          setSuggestions(data.suggestions || []);
          setShowSuggestions(true);
        }
      } else {
        setSuggestions([]);
        setShowSuggestions(false);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (search.trim()) {
      router.push(`/search?q=${encodeURIComponent(search.trim())}`);
      setShowSuggestions(false);
    }
  };

  const navLinks = [
    { href: "/", label: "Home" },
    { href: "/explore", label: "Explore" },
    { href: "/ipl", label: "IPL", accent: true },
    { href: "/t20wc", label: "T20 WC", accent: true },
    { href: "/football", label: "Football" },
    { href: "/cricket", label: "Cricket" },
  ];

  return (
    <nav className="sticky top-0 z-50 bg-[#F4F6FB]/95 backdrop-blur-md border-b border-[#C8D5EE]">
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between gap-4">
        {/* Logo */}
        <Link href="/" className="flex-shrink-0">
          <Image
            src="/logo.png"
            alt="Jerseys Archive"
            width={140}
            height={44}
            className="h-10 w-auto object-contain"
            priority
          />
        </Link>

        {/* Desktop Nav */}
        <div className="hidden md:flex items-center gap-6">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`text-sm font-medium transition-colors ${
                pathname === link.href || pathname.startsWith(link.href + "?")
                  ? "text-[#1B3A7A]"
                  : link.accent
                  ? "text-[#1B3A7A]/80 hover:text-[#1B3A7A]"
                  : "text-[#8A9BC0] hover:text-[#0F1E3D]"
              }`}
            >
              {link.label}
            </Link>
          ))}
        </div>

        {/* Search */}
        <div className="relative flex-1 max-w-xs hidden md:block">
          <form onSubmit={handleSearch}>
            <input
              ref={inputRef}
              data-testid="navbar-search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
              placeholder="Search jerseys, players..."
              className="w-full bg-[#FFFFFF] border border-[#C8D5EE] rounded-lg px-3 py-1.5 text-sm text-[#0F1E3D] placeholder-[#8A9BC0] focus:outline-none focus:border-[#2E5FBF]/60 transition-colors"
            />
          </form>
          {showSuggestions && suggestions.length > 0 && (
            <div className="absolute top-full mt-1 w-full bg-[#FFFFFF] border border-[#C8D5EE] rounded-lg overflow-hidden shadow-xl z-50">
              {suggestions.map((s, i) => (
                <button
                  key={i}
                  data-testid="search-suggestion"
                  className="w-full text-left px-3 py-2 text-sm text-[#8A9BC0] hover:bg-[#EAF0FF] hover:text-[#1B3A7A] transition-colors"
                  onMouseDown={() => {
                    router.push(`/search?q=${encodeURIComponent(s)}`);
                    setSearch(s);
                    setShowSuggestions(false);
                  }}
                >
                  {s}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Mobile menu button */}
        <button
          className="md:hidden text-[#8A9BC0] hover:text-[#0F1E3D]"
          onClick={() => setMenuOpen(!menuOpen)}
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            {menuOpen ? (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            )}
          </svg>
        </button>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="md:hidden bg-[#FFFFFF] border-b border-[#C8D5EE] px-4 py-3 space-y-1">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`block py-2.5 px-2 rounded-lg text-sm transition-colors ${
                pathname === link.href || pathname.startsWith(link.href + "?")
                  ? "text-[#1B3A7A] bg-[#1B3A7A]/5"
                  : link.accent
                  ? "text-[#1B3A7A]/80"
                  : "text-[#8A9BC0] hover:text-[#0F1E3D] hover:bg-[#EAF0FF]"
              }`}
              onClick={() => setMenuOpen(false)}
            >
              {link.label}
            </Link>
          ))}
          <form onSubmit={(e) => { handleSearch(e); setMenuOpen(false); }} className="pt-2">
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search jerseys, players..."
              className="w-full bg-[#F4F6FB] border border-[#C8D5EE] rounded-lg px-3 py-2.5 text-sm text-[#0F1E3D] placeholder-[#8A9BC0] focus:outline-none focus:border-[#2E5FBF]/60"
            />
          </form>
        </div>
      )}
    </nav>
  );
}
