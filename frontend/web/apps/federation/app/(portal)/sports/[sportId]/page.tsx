"use client";

import { Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

import { Card } from "@/components/ui/card";
import { useSportDetailQuery } from "@/hooks/use-federation-data";
import { SharedCharts } from "@/shared";

export default function SportDeepDivePage({ params }: { params: { sportId: string } }) {
  const query = useSportDetailQuery(params.sportId);
  if (!query.data) {
    return <div>Loading...</div>;
  }

  const histogramData = [50, 60, 70, 80, 90].map((bucket) => ({
    bucket: `${bucket}-${bucket + 9}`,
    athletes: query.data.performance.filter((item) => item.value >= bucket && item.value < bucket + 10).length
  }));
  const leaderboard = query.data.performance
    .sort((a, b) => b.percentile_in_sport - a.percentile_in_sport)
    .slice(0, 10)
    .map((item) => ({
      athlete: query.data.athletes.find((athlete) => athlete.id === item.athlete_id)?.name ?? "Athlete",
      percentile: Math.round(item.percentile_in_sport * 100),
      spark: [62, 64, 69, 73, item.value]
    }));
  const heatmapDays = Array.from({ length: 28 }).map((_, index) => ({
    day: index + 1,
    count: query.data.sessions[index % Math.max(query.data.sessions.length, 1)] ? (index % 5) + 1 : 0
  }));
  const riskTrend = Array.from({ length: 8 }).map((_, index) => ({
    week: `W${index + 1}`,
    percent: 12 + index * 4
  }));

  return (
    <div className="space-y-6">
      <div className="grid gap-4 lg:grid-cols-4">
        <Card><p className="text-sm text-[#5F5E5A]">Total athletes</p><p className="mt-3 text-3xl font-bold">{query.data.athletes.length}</p></Card>
        <Card><p className="text-sm text-[#5F5E5A]">Avg ACWR</p><p className="mt-3 text-3xl font-bold">{(query.data.sessions.reduce((sum, item) => sum + Number(item.computed_metrics.acwr ?? 0), 0) / Math.max(query.data.sessions.length, 1)).toFixed(2)}</p></Card>
        <Card><p className="text-sm text-[#5F5E5A]">Injury rate</p><p className="mt-3 text-3xl font-bold">4.8</p></Card>
        <Card><p className="text-sm text-[#5F5E5A]">Avg performance trend</p><p className="mt-3 text-3xl font-bold">+6%</p></Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <Card className="space-y-4">
          <h2 className="text-xl font-bold">Performance distribution histogram</h2>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={histogramData}>
                <CartesianGrid stroke="#D3D1C7" strokeDasharray="3 3" />
                <XAxis dataKey="bucket" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="athletes" fill="#534AB7" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="space-y-4">
          <h2 className="text-xl font-bold">Risk trend</h2>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={riskTrend}>
                <CartesianGrid stroke="#D3D1C7" strokeDasharray="3 3" />
                <XAxis dataKey="week" />
                <YAxis />
                <Tooltip />
                <Line dataKey="percent" stroke="#E24B4A" strokeWidth={3} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1fr_1fr]">
        <Card className="space-y-4">
          <h2 className="text-xl font-bold">Top 10 athletes leaderboard</h2>
          <div className="space-y-3">
            {leaderboard.map((entry) => (
              <div key={entry.athlete} className="rounded-2xl bg-[#F1EFE8] px-4 py-3">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="font-semibold">{entry.athlete}</p>
                    <p className="text-xs text-[#5F5E5A]">{entry.percentile} percentile</p>
                  </div>
                  <SharedCharts.SparkLine data={entry.spark} />
                </div>
              </div>
            ))}
          </div>
        </Card>
        <Card className="space-y-4">
          <h2 className="text-xl font-bold">Session frequency heatmap</h2>
          <div className="grid grid-cols-7 gap-2">
            {heatmapDays.map((item) => (
              <div
                key={item.day}
                className="grid h-10 place-items-center rounded-lg text-xs font-semibold"
                style={{ background: item.count === 0 ? "#F1EFE8" : item.count > 3 ? "#534AB7" : "#CECBF6", color: item.count > 3 ? "#FFFFFF" : "#26215C" }}
              >
                {item.day}
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
