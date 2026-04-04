"use client";

import Link from "next/link";

import { Card } from "@/components/ui/card";
import { useAthleteDetailQuery } from "@/hooks/use-coach-data";
import { SharedCharts, SharedComponents, formatDate } from "@/shared";

export default function AthleteOverviewPage({ params }: { params: { id: string } }) {
  const query = useAthleteDetailQuery(params.id);
  if (!query.data) {
    return <div>Loading...</div>;
  }

  const { athlete, risk, sessions, indices } = query.data;
  const radarData = indices.map((index) => ({ metric: index.index_name, value: index.value, fullMark: 100 }));

  return (
    <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
      <Card className="space-y-5">
        <div className="flex items-start gap-4">
          <SharedComponents.Avatar name={athlete.name} size={64} tier={athlete.tier} />
          <div className="space-y-1">
            <h1 className="text-2xl font-bold">{athlete.name}</h1>
            <p className="text-sm text-[#5F5E5A]">
              {athlete.state} · {athlete.tier}
            </p>
            <p className="text-xs text-[#5F5E5A]">Coach assigned: Meera Singh</p>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <SharedComponents.MetricTile label="Current score" value={risk.score.toFixed(2)} />
          <SharedComponents.MetricTile label="Last session" value={formatDate(sessions[0]?.start_time ?? athlete.created_at)} />
        </div>
      </Card>

      <Card className="space-y-4">
        <h2 className="text-xl font-bold">Risk score and factors</h2>
        <div className="flex items-center gap-6">
          <SharedComponents.RiskIndicator level={risk.risk_level} score={risk.score} />
          <div className="space-y-3">
            {risk.contributing_factors.map((factor, index) => (
              <div key={index} className="rounded-2xl bg-[#F1EFE8] px-4 py-3">
                <p className="font-semibold">{String(factor.title ?? "")}</p>
                <p className="text-xs text-[#5F5E5A]">{String(factor.impact ?? "")}</p>
              </div>
            ))}
          </div>
        </div>
      </Card>

      <Card className="space-y-4">
        <h2 className="text-xl font-bold">Performance indices radar</h2>
        <div className="h-[320px]">
          <SharedCharts.RadarChart data={radarData} />
        </div>
      </Card>

      <Card className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold">Recent session history</h2>
          <Link href={`/athletes/${params.id}/sessions`} className="text-sm font-semibold text-[#534AB7]">
            View all
          </Link>
        </div>
        <div className="space-y-3">
          {sessions.slice(0, 5).map((session) => (
            <div key={session.id} className="rounded-2xl bg-[#F1EFE8] px-4 py-3">
              <div className="flex items-center justify-between">
                <p className="font-semibold capitalize">{session.session_type}</p>
                <SharedComponents.Badge label={`RPE ${session.rpe ?? "-"}`} variant="info" />
              </div>
              <p className="text-xs text-[#5F5E5A]">{session.start_time}</p>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
