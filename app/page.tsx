import { HeroSection } from "@/components/home/HeroSection";
import { StatsBar } from "@/components/home/StatsBar";
import { FeaturedJerseys } from "@/components/home/FeaturedJerseys";
import { getFeaturedJerseys, getStats } from "@/lib/db";

export const revalidate = 300;

async function getData() {
  try {
    const [stats, featured] = await Promise.all([getStats(), getFeaturedJerseys(8)]);
    return { stats, featured };
  } catch {
    return {
      stats: { total: 0, by_sport: [], by_format: [], by_league: [] },
      featured: [],
    };
  }
}

export default async function HomePage() {
  const { stats, featured } = await getData();

  return (
    <div>
      <HeroSection />
      <StatsBar stats={stats} />
      <FeaturedJerseys jerseys={featured} />
    </div>
  );
}
