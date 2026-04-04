"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import { athletes as allAthletes } from "@/lib/mock-data";
import { formatRosterCsv, getLastSessionForAthlete, getRiskForAthlete, getSportName } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { SharedComponents } from "@/shared";

export function RosterTable() {
  const [search, setSearch] = useState("");
  const [sportFilter, setSportFilter] = useState("all");
  const [tierFilter, setTierFilter] = useState("all");
  const [riskFilter, setRiskFilter] = useState("all");
  const [sortKey, setSortKey] = useState<"name" | "tier" | "state">("name");

  const rows = useMemo(() => {
    return [...allAthletes]
      .filter((athlete) => athlete.name.toLowerCase().includes(search.toLowerCase()))
      .filter((athlete) => sportFilter === "all" || getSportName(athlete.sport_id) === sportFilter)
      .filter((athlete) => tierFilter === "all" || athlete.tier === tierFilter)
      .filter((athlete) => {
        const risk = getRiskForAthlete(athlete.id);
        return riskFilter === "all" || risk?.risk_level === riskFilter;
      })
      .sort((a, b) => String(a[sortKey]).localeCompare(String(b[sortKey])));
  }, [riskFilter, search, sortKey, sportFilter, tierFilter]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-3">
        <Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search by name" />
        <Select value={sportFilter} onChange={(event) => setSportFilter(event.target.value)}>
          <option value="all">All sports</option>
          <option value="Athletics">Athletics</option>
          <option value="Boxing">Boxing</option>
        </Select>
        <Select value={tierFilter} onChange={(event) => setTierFilter(event.target.value)}>
          <option value="all">All tiers</option>
          <option value="elite">Elite</option>
          <option value="national">National</option>
          <option value="state">State</option>
        </Select>
        <Select value={riskFilter} onChange={(event) => setRiskFilter(event.target.value)}>
          <option value="all">All risks</option>
          <option value="critical">Critical</option>
          <option value="high">High</option>
          <option value="medium">Medium</option>
          <option value="low">Low</option>
        </Select>
        <Select value={sortKey} onChange={(event) => setSortKey(event.target.value as typeof sortKey)}>
          <option value="name">Sort by name</option>
          <option value="tier">Sort by tier</option>
          <option value="state">Sort by state</option>
        </Select>
        <Button
          variant="secondary"
          onClick={() => {
            const blob = new Blob([formatRosterCsv()], { type: "text/csv;charset=utf-8;" });
            const url = URL.createObjectURL(blob);
            const link = document.createElement("a");
            link.href = url;
            link.download = "athlete-roster.csv";
            link.click();
            URL.revokeObjectURL(url);
          }}
        >
          Export CSV
        </Button>
      </div>
      <div className="overflow-hidden rounded-[24px] border border-[#D3D1C7] bg-white">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-[#F1EFE8] text-[#444441]">
            <tr>
              {["Avatar", "Name", "Sport", "Tier", "State", "Current Risk", "ACWR", "Last Session", "Actions"].map((header) => (
                <th key={header} className="px-4 py-3 font-semibold">
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((athlete) => {
              const risk = getRiskForAthlete(athlete.id);
              const session = getLastSessionForAthlete(athlete.id);
              return (
                <tr key={athlete.id} className="border-t border-[#F1EFE8]">
                  <td className="px-4 py-3">
                    <SharedComponents.Avatar name={athlete.name} />
                  </td>
                  <td className="px-4 py-3">
                    <Link href={`/athletes/${athlete.id}`} className="font-semibold text-[#3C3489]">
                      {athlete.name}
                    </Link>
                  </td>
                  <td className="px-4 py-3">{getSportName(athlete.sport_id)}</td>
                  <td className="px-4 py-3 capitalize">{athlete.tier}</td>
                  <td className="px-4 py-3">{athlete.state}</td>
                  <td className="px-4 py-3">
                    <SharedComponents.Badge label={risk?.risk_level ?? "unknown"} variant={risk?.risk_level === "critical" ? "danger" : risk?.risk_level === "high" ? "warning" : "success"} />
                  </td>
                  <td className="px-4 py-3">{Number(session?.computed_metrics.acwr ?? 0).toFixed(2)}</td>
                  <td className="px-4 py-3">{session?.start_time.slice(0, 10) ?? "-"}</td>
                  <td className="px-4 py-3">
                    <Link href={`/athletes/${athlete.id}`} className="text-[#534AB7]">
                      View
                    </Link>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
