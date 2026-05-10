"use client";

import JerseyForm from "@/components/admin/JerseyForm";

export default function NewJersey() {
  return (
    <div className="p-4 md:p-8 max-w-3xl">
      <h1 className="text-xl md:text-2xl font-bold text-[#0F1E3D] mb-1">Add New Jersey</h1>
      <p className="text-sm text-[#4A6FA5] mb-6">Fill in the details and upload images for a new jersey entry.</p>
      <JerseyForm mode="create" />
    </div>
  );
}
