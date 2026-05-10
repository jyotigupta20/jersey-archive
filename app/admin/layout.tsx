"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [authed, setAuthed] = useState(false);
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    const stored = sessionStorage.getItem("admin_auth");
    if (stored === "true") setAuthed(true);
  }, []);

  // Auto-close mobile nav on route change
  useEffect(() => {
    setMobileNavOpen(false);
  }, [pathname]);

  // Body scroll lock when nav drawer is open
  useEffect(() => {
    if (mobileNavOpen) {
      const original = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = original;
      };
    }
  }, [mobileNavOpen]);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/admin/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      if (res.ok) {
        sessionStorage.setItem("admin_auth", "true");
        sessionStorage.setItem("admin_password", password);
        setAuthed(true);
      } else {
        setError("Invalid password");
      }
    } catch {
      setError("Connection error");
    } finally {
      setLoading(false);
    }
  }

  if (!authed) {
    return (
      <div className="min-h-screen bg-[#F4F6FB] flex items-center justify-center p-4">
        <div className="w-full max-w-sm">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-[#0F1E3D]">
              Jersey<span className="text-[#1B3A7A]">Archive</span>
            </h1>
            <p className="text-sm text-[#4A6FA5] mt-2">Admin Panel</p>
          </div>
          <form onSubmit={handleLogin} className="bg-[#FFFFFF] border border-[#C8D5EE] rounded-xl p-6 space-y-4">
            <div>
              <label className="text-xs text-[#4A6FA5] uppercase tracking-wider block mb-1">Password</label>
              <input
                type="password"
                data-testid="admin-password-input"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter admin password"
                className="w-full bg-[#F4F6FB] border border-[#C8D5EE] rounded-lg px-3 py-2.5 text-base text-[#0F1E3D] placeholder-gray-600 focus:outline-none focus:border-yellow-500/50"
                autoFocus
              />
            </div>
            {error && <p className="text-xs text-red-400">{error}</p>}
            <button
              type="submit"
              data-testid="admin-login-button"
              disabled={loading || !password}
              className="w-full bg-[#1B3A7A] hover:bg-[#122B5F] text-white font-semibold py-3 rounded-lg text-sm transition-colors disabled:opacity-50 min-h-[48px]"
            >
              {loading ? "Signing in..." : "Sign In"}
            </button>
          </form>
        </div>
      </div>
    );
  }

  const navLinks = [
    { href: "/admin", label: "Dashboard", icon: "📊" },
    { href: "/admin/jerseys", label: "Jerseys", icon: "👕" },
    { href: "/admin/jerseys/new", label: "Add Jersey", icon: "➕" },
    { href: "/admin/import", label: "Import CSV", icon: "📂" },
  ];

  function signOut() {
    sessionStorage.removeItem("admin_auth");
    sessionStorage.removeItem("admin_password");
    setAuthed(false);
  }

  const navContent = (
    <>
      <div className="p-4 border-b border-[#C8D5EE]">
        <Link href="/" className="text-sm font-bold">
          Jersey<span className="text-[#1B3A7A]">Archive</span>
        </Link>
        <p className="text-xs text-[#6B85A8] mt-0.5">Admin</p>
      </div>
      <nav data-testid="admin-sidebar" className="flex-1 p-3 space-y-1">
        {navLinks.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className={`flex items-center gap-2 px-3 py-3 md:py-2 rounded-lg text-sm transition-colors min-h-[44px] md:min-h-0 ${
              pathname === link.href
                ? "bg-[#1B3A7A]/20 text-[#2E5FBF]"
                : "text-[#4A6FA5] hover:bg-[#EAF0FF] hover:text-[#1B3A7A]"
            }`}
          >
            <span>{link.icon}</span>
            {link.label}
          </Link>
        ))}
      </nav>
      <div className="p-3 border-t border-[#C8D5EE]">
        <button
          onClick={signOut}
          className="w-full text-xs text-[#6B85A8] hover:text-[#2A4A7A] py-2 transition-colors"
        >
          Sign Out
        </button>
      </div>
    </>
  );

  return (
    <div className="min-h-screen bg-[#F4F6FB] md:flex">
      {/* Mobile top bar */}
      <header className="md:hidden sticky top-0 z-40 bg-white border-b border-[#C8D5EE] flex items-center justify-between px-4 h-14">
        <button
          onClick={() => setMobileNavOpen(true)}
          aria-label="Open admin menu"
          className="w-10 h-10 flex items-center justify-center rounded-lg text-[#4A6FA5] hover:bg-[#EAF0FF] active:bg-[#C8D5EE]"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
        <Link href="/" className="text-sm font-bold text-[#0F1E3D]">
          Jersey<span className="text-[#1B3A7A]">Archive</span> <span className="text-xs text-[#6B85A8]">Admin</span>
        </Link>
        <div className="w-10" />
      </header>

      {/* Mobile drawer */}
      {mobileNavOpen && (
        <div className="md:hidden fixed inset-0 z-50" role="dialog" aria-modal="true">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setMobileNavOpen(false)}
            style={{ animation: "fadeIn 0.2s ease-out" }}
          />
          <aside
            className="absolute top-0 left-0 bottom-0 w-72 max-w-[80%] bg-white shadow-xl flex flex-col"
            style={{ animation: "slideRight 0.25s cubic-bezier(0.22,1,0.36,1)" }}
          >
            {navContent}
          </aside>
        </div>
      )}

      {/* Desktop sidebar */}
      <aside className="hidden md:flex w-56 bg-[#FFFFFF] border-r border-[#C8D5EE] flex-col">
        {navContent}
      </aside>

      {/* Main */}
      <main className="flex-1 overflow-auto">
        {children}
      </main>
    </div>
  );
}
