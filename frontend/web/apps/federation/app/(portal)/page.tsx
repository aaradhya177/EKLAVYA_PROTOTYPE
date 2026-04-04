"use client";

import Link from "next/link";
import { Bar, BarChart, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { ComposableMap, Geographies, Geography } from "react-simple-maps";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useOverviewQuery } from "@/hooks/use-federation-data";
import { athleteDensityByState, getSportName } from "@/lib/utils";
import { useFederationStore } from "@/stores";

const geoUrl = "https://cdn.jsdelivr.net/npm/us-atlas@3/states-10m.json";

export default function FederationOverviewPage() {
  const query = useOverviewQuery();
  const selectedState = useFederationStore((state) => state.selectedState);
  const setSelectedState = useFederationStore((state) => state.setSelectedState);

  if (!query.data) {
    return <div>Loading...</div>;
  }

  const density = athleteDensityByState();
  const filteredAthletes = selectedState ? query.data.athletes.filter((athlete) => athlete.state === selectedState) : query.data.athletes;
  const stateMetricCount = Object.keys(density).length;
  const sportBreakdown = query.data.sports.map((sport) => ({
    sport: sport.name,
    athletes: filteredAthletes.filter((athlete) => athlete.sport_id === sport.id).length
  }));
  const riskDistribution = ["low", "medium", "high", "critical"].map((level) => ({
    name: level,
    value: query.data.riskScores.filter((risk) => risk.risk_level === level).length
  }));
  const topPerformers = [...query.data.performanceIndices].sort((a, b) => b.percentile_in_sport - a.percentile_in_sport).slice(0, 4);

  return (
    <div className="space-y-6">
      <div className="grid gap-4 lg:grid-cols-4">
        <Card><p className="text-sm text-[#5F5E5A]">Total registered athletes</p><p className="mt-3 text-3xl font-bold">{query.data.athletes.length}</p></Card>
        <Card><p className="text-sm text-[#5F5E5A]">Active this month</p><p className="mt-3 text-3xl font-bold">{query.data.sessions.length}</p></Card>
        <Card><p className="text-sm text-[#5F5E5A]">Critical risk alerts today</p><p className="mt-3 text-3xl font-bold text-[#A32D2D]">{query.data.riskScores.filter((risk) => risk.risk_level === "critical").length}</p></Card>
        <Card><p className="text-sm text-[#5F5E5A]">Talent signals this week</p><p className="mt-3 text-3xl font-bold">{query.data.talentSignals.length}</p></Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1fr_1fr]">
        <Card className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold">India state density</h2>
            <Button variant="secondary" onClick={() => setSelectedState(null)}>Reset</Button>
          </div>
          <div className="h-[360px]">
            <ComposableMap projection="geoMercator">
              <Geographies geography={geoUrl}>
                {({ geographies }) =>
                  geographies.slice(0, Math.max(geographies.length - 20, 0)).map((geo, index) => {
                    const stateNames = Object.keys(density);
                    const state = stateNames[index % Math.max(stateMetricCount, 1)] ?? "Haryana";
                    const count = density[state] ?? 0;
                    return (
                      <Geography
                        key={geo.rsmKey}
                        geography={geo}
                        onClick={() => setSelectedState(state)}
                        style={{
                          default: { fill: count > 1 ? "#534AB7" : "#CECBF6", stroke: "#FFFFFF", outline: "none" },
                          hover: { fill: "#7F77DD", outline: "none" },
                          pressed: { fill: "#26215C", outline: "none" }
                        }}
                      />
                    );
                  })
                }
              </Geographies>
            </ComposableMap>
          </div>
          {selectedState ? <p className="text-sm text-[#5F5E5A]">Filtering dashboard to {selectedState}</p> : null}
        </Card>

        <Card className="space-y-4">
          <h2 className="text-xl font-bold">Sport breakdown</h2>
          <div className="h-[360px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={sportBreakdown}>
                <XAxis dataKey="sport" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="athletes" fill="#534AB7" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-[0.8fr_1.2fr]">
        <Card className="space-y-4">
          <h2 className="text-xl font-bold">Risk distribution</h2>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={riskDistribution} dataKey="value" nameKey="name" outerRadius={100}>
                  {riskDistribution.map((item) => (
                    <Cell
                      key={item.name}
                      fill={
                        item.name === "critical" ? "#E24B4A" : item.name === "high" ? "#D85A30" : item.name === "medium" ? "#BA7517" : "#639922"
                      }
                    />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <div className="grid gap-6">
          <Card className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold">Recent talent signals</h2>
              <Link href="/talent" className="text-sm font-semibold text-[#534AB7]">Open board</Link>
            </div>
            <div className="space-y-3">
              {query.data.talentSignals.slice(0, 10).map((signal) => (
                <div key={signal.id} className="rounded-2xl bg-[#F1EFE8] px-4 py-3">
                  <p className="font-semibold">{query.data.athletes.find((athlete) => athlete.id === signal.athlete_id)?.name}</p>
                  <p className="text-xs text-[#5F5E5A]">{getSportName(query.data.athletes.find((athlete) => athlete.id === signal.athlete_id)?.sport_id ?? 1)} · {String(signal.evidence[0]?.title ?? "")}</p>
                </div>
              ))}
            </div>
          </Card>

          <Card className="space-y-4">
            <h2 className="text-xl font-bold">Top performing athletes this month</h2>
            <div className="space-y-3">
              {topPerformers.map((item) => (
                <div key={item.id} className="rounded-2xl bg-[#F1EFE8] px-4 py-3">
                  <p className="font-semibold">{query.data.athletes.find((athlete) => athlete.id === item.athlete_id)?.name}</p>
                  <p className="text-xs text-[#5F5E5A]">{item.index_name} · {Math.round(item.percentile_in_sport * 100)} percentile</p>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
