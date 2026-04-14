import Link from "next/link";
import Image from "next/image";

export function Footer() {
  return (
    <footer className="border-t border-[#C8D5EE] bg-[#F4F6FB] mt-auto">
      <div className="max-w-7xl mx-auto px-4 py-10">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <div className="mb-3">
              <Image src="/logo.png" alt="Jerseys Archive" width={120} height={38} className="h-9 w-auto opacity-90" />
            </div>
            <p className="text-sm text-[#6B85A8] leading-relaxed">
              The definitive archive of football and cricket jerseys. Celebrating the art, history, and culture behind every kit.
            </p>
          </div>
          <div>
            <h4 className="text-xs font-semibold text-[#4A6FA5] uppercase tracking-widest mb-3">Browse</h4>
            <div className="space-y-2">
              {[
                { href: "/cricket", label: "Cricket Jerseys" },
                { href: "/football", label: "Football Jerseys" },
                { href: "/explore", label: "Explore All" },
                { href: "/search", label: "Search" },
              ].map((link) => (
                <Link key={link.href} href={link.href} className="block text-sm text-[#6B85A8] hover:text-[#2A4A7A] transition-colors">
                  {link.label}
                </Link>
              ))}
            </div>
          </div>
          <div>
            <h4 className="text-xs font-semibold text-[#4A6FA5] uppercase tracking-widest mb-3">Leagues</h4>
            <div className="space-y-2">
              {["IPL", "T20 World Cup", "ODI 50-50", "UEFA Champions League"].map((league) => (
                <Link
                  key={league}
                  href={`/explore?league=${encodeURIComponent(league)}`}
                  className="block text-sm text-[#6B85A8] hover:text-[#2A4A7A] transition-colors"
                >
                  {league}
                </Link>
              ))}
            </div>
          </div>
        </div>
        <div className="mt-8 pt-6 border-t border-[#C8D5EE] flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-xs text-[#7A93B5]">© 2025 JerseyArchive. For fans, by fans.</p>
          <Link href="/admin" className="text-xs text-gray-700 hover:text-[#6B85A8] transition-colors">
            Admin
          </Link>
        </div>
      </div>
    </footer>
  );
}
