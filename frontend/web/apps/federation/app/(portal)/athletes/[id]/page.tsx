"use client";

import { Card } from "@/components/ui/card";
import { useAthleteDetailQuery } from "@/hooks/use-federation-data";
import { SharedCharts, SharedComponents } from "@/shared";

export default function FederationAthleteDetailPage({ params }: { params: { id: string } }) {
  const query = useAthleteDetailQuery(params.id);
  if (!query.data) {
    return <div>Loading...</div>;
  }

  const radarData = query.data.performance.map((index) => ({ metric: index.index_name, value: index.value, fullMark: 100 }));

  return (
    <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
      <Card className="space-y-4">
        <div className="flex items-start gap-4">
          <SharedComponents.Avatar name={query.data.athlete.name} size={72} tier={query.data.athlete.tier} />
          <div>
            <h1 className="text-2xl font-bold">{query.data.athlete.name}</h1>
            <p className="text-sm text-[#5F5E5A]">{query.data.athlete.state} · {query.data.athlete.tier}</p>
          </div>
        </div>
        <SharedComponents.RiskIndicator level={query.data.risk.risk_level} score={query.data.risk.score} />
      </Card>
      <Card className="space-y-4">
        <h2 className="text-xl font-bold">Performance overview</h2>
        <div className="h-[320px]">
          <SharedCharts.RadarChart data={radarData} />
        </div>
      </Card>
      <Card className="space-y-4 xl:col-span-2">
        <h2 className="text-xl font-bold">Recent sessions</h2>
        <div className="space-y-3">
          {query.data.sessions.map((session) => (
            <div key={session.id} className="rounded-2xl bg-[#F1EFE8] px-4 py-3">
              <p className="font-semibold capitalize">{session.session_type}</p>
              <p className="text-xs text-[#5F5E5A]">{session.start_time}</p>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
