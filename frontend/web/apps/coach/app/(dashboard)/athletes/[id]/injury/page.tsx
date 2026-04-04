"use client";

import { useMemo, useState } from "react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAthleteDetailQuery } from "@/hooks/use-coach-data";

const bodyParts = ["Hamstring", "Knee", "Shoulder", "Back"];

export default function AthleteInjuryPage({ params }: { params: { id: string } }) {
  const query = useAthleteDetailQuery(params.id);
  const [selectedBodyPart, setSelectedBodyPart] = useState<string | null>(null);

  if (!query.data) {
    return <div>Loading...</div>;
  }

  const factors = query.data.risk.contributing_factors.map((factor, index) => ({
    name: String(factor.title ?? `Factor ${index + 1}`),
    impact: Number(String(factor.impact ?? "0").replace(/[^0-9.-]/g, "")) || 10
  }));
  const history = useMemo(
    () =>
      [
        { id: "h1", bodyPart: "Hamstring", summary: "Moderate strain · Oct 2024" },
        { id: "h2", bodyPart: "Back", summary: "Low-grade tightness · Jan 2025" }
      ].filter((item) => !selectedBodyPart || item.bodyPart === selectedBodyPart),
    [selectedBodyPart]
  );

  return (
    <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
      <Card className="space-y-4">
        <h2 className="text-xl font-bold">Current risk and SHAP breakdown</h2>
        <div className="h-[320px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={factors} layout="vertical">
              <CartesianGrid stroke="#D3D1C7" strokeDasharray="3 3" />
              <XAxis type="number" />
              <YAxis dataKey="name" type="category" width={140} />
              <Tooltip />
              <Bar dataKey="impact" fill="#D85A30" radius={[0, 8, 8, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>

      <Card className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold">Body map</h2>
          <Button variant="secondary">Log injury</Button>
        </div>
        <svg viewBox="0 0 140 280" className="mx-auto h-[280px]">
          {bodyParts.map((part, index) => (
            <g key={part} onClick={() => setSelectedBodyPart(part)} style={{ cursor: "pointer" }}>
              <rect x={40 + index * 8} y={30 + index * 40} width="50" height="22" fill={selectedBodyPart === part ? "#D85A30" : "#CECBF6"} rx="10" />
              <text x={65 + index * 8} y={45 + index * 40} textAnchor="middle" fontSize="8">
                {part}
              </text>
            </g>
          ))}
        </svg>
      </Card>

      <Card className="space-y-4 xl:col-span-2">
        <h2 className="text-xl font-bold">Injury history timeline</h2>
        <div className="space-y-3">
          {history.map((item) => (
            <div key={item.id} className="rounded-2xl bg-[#F1EFE8] px-4 py-3">
              <p className="font-semibold">{item.bodyPart}</p>
              <p className="text-xs text-[#5F5E5A]">{item.summary}</p>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
