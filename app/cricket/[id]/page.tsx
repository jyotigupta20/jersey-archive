import { getJersey, getRelatedJerseys } from "@/lib/elasticsearch";
import { notFound } from "next/navigation";
import { JerseyDetailView } from "@/components/jersey/JerseyDetail";

interface PageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: PageProps) {
  const { id } = await params;
  const jersey = await getJersey(id);
  if (!jersey) return { title: "Jersey Not Found" };
  return {
    title: `${jersey.team} ${jersey.season} — Jersey Archive`,
    description: jersey.design_description || `${jersey.team} ${jersey.jersey_type} jersey from ${jersey.season}`,
  };
}

export default async function CricketJerseyPage({ params }: PageProps) {
  const { id } = await params;

  let jersey, related;
  try {
    [jersey, related] = await Promise.all([
      getJersey(id),
      getJersey(id).then((j) => (j ? getRelatedJerseys(j) : [])),
    ]);
  } catch {
    notFound();
  }

  if (!jersey) notFound();

  return <JerseyDetailView jersey={jersey} related={related || []} />;
}
