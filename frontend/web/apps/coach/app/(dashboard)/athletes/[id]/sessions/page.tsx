"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Area, Bar, CartesianGrid, ComposedChart, Legend, Line, LineChart, ReferenceArea, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { useAthleteDetailQuery } from "@/hooks/use-coach-data";

export default function AthleteSessionsPage({ params }: { params: { id: string } }) {
  const query = useAthleteDetailQuery(params.id);
  const [typeFilter, setTypeFilter] = useState("all");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  if (!query.data) {
    return <div>Loading...</div>;
  }

  const filtered = useMemo(
    () =>
      query.data.sessions.filter((session) => {
        const matchesType = typeFilter === "all" || session.session_type === typeFilter;
        const matchesStart = !startDate || session.start_time >= startDate;
        const matchesEnd = !endDate || session.start_time <= endDate;
        return matchesType && matchesStart && matchesEnd;
      }),
    [endDate, query.data.sessions, startDate, typeFilter]
  );

  const trendData = Array.from({ length: 12 }).map((_, index) => ({
    day: `D${index + 1}`,
    load: 40 + index * 5,
    acwr: 0.9 + index * 0.04
  }));

  return (
    <div className="space-y-6">
      <Card className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold">Session history</h2>
          <Link href="/sessions/log">
            <Button>Log new session</Button>
          </Link>
        </div>
        <div className="grid gap-3 md:grid-cols-3">
          <Select value={typeFilter} onChange={(event) => setTypeFilter(event.target.value)}>
            <option value="all">All session types</option>
            <option value="training">Training</option>
            <option value="competition">Competition</option>
            <option value="recovery">Recovery</option>
          </Select>
          <Input type="date" value={startDate} onChange={(event) => setStartDate(event.target.value)} />
          <Input type="date" value={endDate} onChange={(event) => setEndDate(event.target.value)} />
        </div>
        <div className="space-y-3">
          {filtered.map((session) => (
            <div key={session.id} className="rounded-2xl bg-[#F1EFE8] px-4 py-3">
              <div className="flex items-center justify-between">
                <p className="font-semibold capitalize">{session.session_type}</p>
                <p className="text-sm">Load {Number(session.computed_metrics.load ?? 0)}</p>
              </div>
              <p className="text-xs text-[#5F5E5A]">{session.start_time}</p>
            </div>
          ))}
        </div>
      </Card>

      <Card className="space-y-4">
        <h2 className="text-xl font-bold">Load trend</h2>
        <div className="h-[280px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={trendData}>
              <CartesianGrid stroke="#D3D1C7" strokeDasharray="3 3" />
              <XAxis dataKey="day" />
              <YAxis />
              <Tooltip />
              <Line dataKey="load" stroke="#534AB7" strokeWidth={3} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </Card>

      <Card className="space-y-4">
        <h2 className="text-xl font-bold">ACWR trend</h2>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={trendData}>
              <CartesianGrid stroke="#D3D1C7" strokeDasharray="3 3" />
              <XAxis dataKey="day" />
              <YAxis domain={[0, 2]} />
              <Tooltip />
              <Legend />
              <ReferenceArea y1={0.8} y2={1.3} fill="#E1F5EE" fillOpacity={0.7} />
              <Area dataKey="acwr" fill="#CECBF6" stroke="#7F77DD" />
              <Bar dataKey="load" fill="#1D9E75" opacity={0.25} />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </Card>
    </div>
  );
}
