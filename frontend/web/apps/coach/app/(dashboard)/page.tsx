"use client";

import Link from "next/link";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

import { Card } from "@/components/ui/card";
import { SummaryCard } from "@/components/summary-card";
import { Button } from "@/components/ui/button";
import { useOverviewQuery } from "@/hooks/use-coach-data";
import { getSportName } from "@/lib/utils";
import { SharedComponents } from "@/shared";

export default function DashboardOverviewPage() {
  const query = useOverviewQuery();
  if (!query.data) {
    return <div>Loading...</div>;
  }

  const highRiskCount = query.data.riskScores.filter((risk) => risk.risk_level === "high" || risk.risk_level === "critical").length;
  const chartData = query.data.athletes.map((athlete) => {
    const session = query.data.sessions.find((item) => item.athlete_id === athlete.id);
    const risk = query.data.riskScores.find((item) => item.athlete_id === athlete.id);
    return {
      name: athlete.name.split(" ")[0],
      load: Number(session?.computed_metrics.load ?? 0),
      risk: risk?.risk_level ?? "low"
    };
  });

  return (
    <div className="space-y-6">
      <div className="grid gap-4 lg:grid-cols-4">
        <SummaryCard label="Total athletes" value={query.data.athletes.length} />
        <SummaryCard label="Sessions today" value={query.data.sessions.length} />
        <SummaryCard label="High / critical risk" value={highRiskCount} tone="danger" />
        <SummaryCard label="Competitions this week" value={query.data.careerGoals.length} />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <Card className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold">Risk alerts</h2>
            <Link href="/alerts" className="text-sm font-semibold text-[#534AB7]">
              View all
            </Link>
          </div>
          <div className="space-y-3">
            {query.data.alerts
              .sort((a, b) => b.score - a.score)
              .map((alert) => (
                <Link key={alert.id} href={`/athletes/${alert.athleteId}/injury`} className="block rounded-2xl bg-[#F1EFE8] px-4 py-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-[#2C2C2A]">{alert.athleteName}</p>
                      <p className="text-xs text-[#5F5E5A]">{alert.topFactor}</p>
                    </div>
                    <SharedComponents.Badge label={alert.riskLevel} variant={alert.riskLevel === "critical" ? "danger" : "warning"} />
                  </div>
                </Link>
              ))}
          </div>
        </Card>

        <Card className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold">Quick action</h2>
            <Link href="/sessions/log">
              <Button>+ Log Session</Button>
            </Link>
          </div>
          <div className="rounded-[24px] bg-[#26215C] p-6 text-white">
            <p className="text-sm text-[#CECBF6]">Today&apos;s sessions</p>
            <ul className="mt-3 space-y-2 text-sm">
              {query.data.athletes.map((athlete) => {
                const trained = query.data.sessions.some((session) => session.athlete_id === athlete.id);
                return (
                  <li key={athlete.id} className="flex items-center justify-between">
                    <span>
                      {athlete.name} · {getSportName(athlete.sport_id)}
                    </span>
                    <span className={trained ? "text-[#9FE1CB]" : "text-[#F5C4B3]"}>{trained ? "Trained" : "Missed vs plan"}</span>
                  </li>
                );
              })}
            </ul>
          </div>
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <Card className="space-y-4">
          <h2 className="text-xl font-bold">Team load chart</h2>
          <div className="h-[320px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid stroke="#D3D1C7" strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="load" fill="#534AB7" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <div className="space-y-6">
          <Card className="space-y-4">
            <h2 className="text-xl font-bold">Recent talent signals</h2>
            <div className="space-y-3">
              {query.data.talentSignals.map((signal) => (
                <div key={signal.id} className="rounded-2xl bg-[#F1EFE8] px-4 py-3">
                  <p className="font-semibold capitalize">{signal.signal_type}</p>
                  <p className="text-xs text-[#5F5E5A]">{String(signal.evidence[0]?.title ?? "")}</p>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
