interface StatsBarProps {
  stats: {
    total: number;
    by_sport: { key: string; doc_count: number }[];
    by_format: { key: string; doc_count: number }[];
  };
}

export function StatsBar({ stats }: StatsBarProps) {
  const cricket = stats.by_sport.find((s) => s.key === "cricket")?.doc_count || 0;
  const football = stats.by_sport.find((s) => s.key === "football")?.doc_count || 0;

  const items = [
    { label: "Total Jerseys", value: stats.total },
    { label: "Cricket", value: cricket },
    { label: "Football", value: football },
    { label: "Leagues", value: stats.by_format.length },
  ];

  return (
    <div className="bg-[#FFFFFF] border-y border-[#C8D5EE]">
      <div className="max-w-7xl mx-auto px-4 py-4 md:py-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
          {items.map((item) => (
            <div key={item.label} className="text-center">
              <div
                className="text-2xl md:text-3xl font-bold text-[#0F1E3D] tabular-nums"
                {...(item.label === "Total Jerseys" ? { "data-testid": "stats-total" } : {})}
              >
                {item.value.toLocaleString()}
              </div>
              <div className="text-xs text-[#6B85A8] uppercase tracking-widest mt-1">{item.label}</div>
            </div>

          ))}
        </div>
      </div>
    </div>
  );
}
