"use client";

import { useState } from "react";

interface ParsedRow {
  team: string;
  season: string;
  jersey_type: string;
  format: string;
  rating: number;
}

export default function AdminImport() {
  const [file, setFile] = useState<File | null>(null);
  const [format, setFormat] = useState("IPL");
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<{ imported: number; jerseys: ParsedRow[] } | null>(null);
  const [error, setError] = useState("");

  async function handleImport() {
    if (!file) return;
    setImporting(true);
    setError("");
    setResult(null);

    const password = sessionStorage.getItem("admin_password") || "";
    const formData = new FormData();
    formData.append("file", file);
    formData.append("format", format);

    try {
      const res = await fetch("/api/admin/import", {
        method: "POST",
        headers: { "x-admin-password": password },
        body: formData,
      });
      const data = await res.json();
      if (res.ok) {
        setResult(data);
      } else {
        setError(data.error || "Import failed");
      }
    } catch {
      setError("Network error");
    } finally {
      setImporting(false);
    }
  }

  return (
    <div className="p-8 max-w-2xl">
      <h1 className="text-2xl font-bold text-[#0F1E3D] mb-2">Import from CSV</h1>
      <p className="text-sm text-[#4A6FA5] mb-8">Upload a CSV file to bulk-import jerseys.</p>

      <div className="bg-[#FFFFFF] border border-[#C8D5EE] rounded-xl p-6 space-y-5">
        <div>
          <label className="block text-xs text-[#4A6FA5] uppercase tracking-wider mb-2">Format</label>
          <select
            value={format}
            onChange={(e) => setFormat(e.target.value)}
            className="w-full bg-[#F4F6FB] border border-[#C8D5EE] rounded-lg px-3 py-2 text-sm text-[#0F1E3D] focus:outline-none focus:border-yellow-500/50"
          >
            <option value="IPL">IPL</option>
            <option value="T20">T20</option>
            <option value="ODI">ODI</option>
            <option value="UCL">UCL (Football)</option>
          </select>
        </div>

        <div>
          <label className="block text-xs text-[#4A6FA5] uppercase tracking-wider mb-2">CSV File</label>
          <div
            className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors ${
              file ? "border-[#1B3A7A]/50 bg-[#1B3A7A]/5" : "border-[#C8D5EE] hover:border-[#A8BDD8]"
            }`}
          >
            <input
              type="file"
              accept=".csv"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
              className="hidden"
              id="csv-upload"
            />
            <label htmlFor="csv-upload" className="cursor-pointer">
              {file ? (
                <div>
                  <p className="text-[#2E5FBF] font-medium text-sm">{file.name}</p>
                  <p className="text-xs text-[#6B85A8] mt-1">{(file.size / 1024).toFixed(1)} KB</p>
                </div>
              ) : (
                <div>
                  <svg className="w-10 h-10 text-[#7A93B5] mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                  <p className="text-sm text-[#4A6FA5]">Click to upload CSV</p>
                  <p className="text-xs text-[#7A93B5] mt-1">Supports IPL, T20, ODI, UCL formats</p>
                </div>
              )}
            </label>
          </div>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-3">
            <p className="text-sm text-red-400">{error}</p>
          </div>
        )}

        <button
          onClick={handleImport}
          disabled={!file || importing}
          className="w-full bg-[#1B3A7A] hover:bg-[#122B5F] text-white font-semibold py-3 rounded-lg text-sm transition-colors disabled:opacity-50"
        >
          {importing ? "Importing..." : "Import Jerseys"}
        </button>
      </div>

      {result && (
        <div className="mt-6 bg-[#FFFFFF] border border-emerald-500/20 rounded-xl p-6">
          <div className="flex items-center gap-2 mb-4">
            <span className="text-emerald-400 text-lg">✓</span>
            <h3 className="text-[#0F1E3D] font-semibold">Successfully imported {result.imported} jerseys</h3>
          </div>
          {result.jerseys.length > 0 && (
            <div>
              <p className="text-xs text-[#4A6FA5] uppercase tracking-wider mb-3">Preview (first 5)</p>
              <div className="space-y-2">
                {result.jerseys.map((j, i) => (
                  <div key={i} className="flex items-center gap-3 text-sm">
                    <span className="text-[#2A4A7A] font-medium">{j.team}</span>
                    <span className="text-[#6B85A8]">{j.season}</span>
                    <span className="text-[#7A93B5]">{j.jersey_type}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
