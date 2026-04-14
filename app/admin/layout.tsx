"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [authed, setAuthed] = useState(false);
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    const stored = sessionStorage.getItem("admin_auth");
    if (stored === "true") setAuthed(true);
  }, []);

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
                className="w-full bg-[#F4F6FB] border border-[#C8D5EE] rounded-lg px-3 py-2 text-sm text-[#0F1E3D] placeholder-gray-600 focus:outline-none focus:border-yellow-500/50"
                autoFocus
              />
            </div>
            {error && <p className="text-xs text-red-400">{error}</p>}
            <button
              type="submit"
              data-testid="admin-login-button"
              disabled={loading || !password}
              className="w-full bg-[#1B3A7A] hover:bg-[#122B5F] text-white font-semibold py-2.5 rounded-lg text-sm transition-colors disabled:opacity-50"
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

  return (
    <div className="min-h-screen bg-[#F4F6FB] flex">
      {/* Sidebar */}
      <aside className="w-56 bg-[#FFFFFF] border-r border-[#C8D5EE] flex flex-col">
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
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${
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
            onClick={() => {
              sessionStorage.removeItem("admin_auth");
              sessionStorage.removeItem("admin_password");
              setAuthed(false);
            }}
            className="w-full text-xs text-[#6B85A8] hover:text-[#2A4A7A] py-2 transition-colors"
          >
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 overflow-auto">
        {children}
      </main>
    </div>
  );
}
