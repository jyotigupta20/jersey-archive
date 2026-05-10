"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Jersey } from "@/lib/types";
import JerseyForm from "@/components/admin/JerseyForm";

export default function EditJersey() {
  const params = useParams();
  const id = params.id as string;

  const [loading, setLoading] = useState(true);
  const [jersey, setJersey] = useState<Jersey | null>(null);

  useEffect(() => {
    fetch(`/api/jerseys/${id}`)
      .then((r) => r.json())
      .then((data: Jersey) => setJersey(data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <div className="p-4 md:p-8 text-[#4A6FA5]">Loading...</div>;
  if (!jersey) return <div className="p-4 md:p-8 text-red-500">Jersey not found</div>;

  return (
    <div className="p-4 md:p-8 max-w-3xl">
      <h1 className="text-xl md:text-2xl font-bold text-[#0F1E3D] mb-1">Edit Jersey</h1>
      <p className="text-sm text-[#4A6FA5] mb-6">
        {jersey.team} &middot; {jersey.season} &middot; {jersey.format}
      </p>
      <JerseyForm jersey={jersey} mode="edit" />
    </div>
  );
}
