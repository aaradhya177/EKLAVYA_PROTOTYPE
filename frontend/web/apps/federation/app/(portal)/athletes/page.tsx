"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import * as XLSX from "xlsx";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { useAthletesQuery } from "@/hooks/use-federation-data";
import { assignedCoaches, athletes, lastMedicalChecks, talentSignals } from "@/lib/mock-data";
import { buildAthleteWorkbook, getAthleteAge, getRiskForAthlete, getSportName } from "@/lib/utils";
import { useFederationStore } from "@/stores";
import { SharedComponents } from "@/shared";

export default function FederationAthletesPage() {
  const query = useAthletesQuery();
  const selectedState = useFederationStore((state) => state.selectedState);
  const [search, setSearch] = useState("");
  const [sportFilter, setSportFilter] = useState("all");
  const [tierFilter, setTierFilter] = useState("all");
  const [riskFilter, setRiskFilter] = useState("all");
  const [signalFilter, setSignalFilter] = useState("all");
  const [ageRange, setAgeRange] = useState("all");

  const rows = useMemo(() => {
    const source = query.data ?? athletes;
    return source.filter((athlete) => {
      const risk = getRiskForAthlete(athlete.id);
      const age = getAthleteAge(athlete.dob);
      const hasSignal = talentSignals.some((signal) => signal.athlete_id === athlete.id);
      return (
        athlete.name.toLowerCase().includes(search.toLowerCase()) &&
        (!selectedState || athlete.state === selectedState) &&
        (sportFilter === "all" || getSportName(athlete.sport_id) === sportFilter) &&
        (tierFilter === "all" || athlete.tier === tierFilter) &&
        (riskFilter === "all" || risk?.risk_level === riskFilter) &&
        (signalFilter === "all" || (signalFilter === "yes" ? hasSignal : !hasSignal)) &&
        (ageRange === "all" || (ageRange === "under18" ? age < 18 : age >= 18 && age <= 23))
      );
    });
  }, [ageRange, query.data, riskFilter, search, selectedState, signalFilter, sportFilter, tierFilter]);

  return (
    <Card className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Federation athlete roster</h1>
          <p className="text-sm text-[#5F5E5A]">Cross-sport federation view with advanced filtering and bulk export.</p>
        </div>
        <div className="flex gap-3">
          <Button
            variant="secondary"
            onClick={() => {
              const workbook = buildAthleteWorkbook();
              XLSX.writeFile(workbook, "federation-athletes.xlsx");
            }}
          >
            Export Excel
          </Button>
          <Button>Assign to scheme</Button>
          <Button variant="ghost">Flag for review</Button>
        </div>
      </div>
      <div className="grid gap-3 md:grid-cols-3 xl:grid-cols-6">
        <Input placeholder="Search by name" value={search} onChange={(event) => setSearch(event.target.value)} />
        <Select value={sportFilter} onChange={(event) => setSportFilter(event.target.value)}>
          <option value="all">All sports</option>
          <option value="Athletics">Athletics</option>
          <option value="Boxing">Boxing</option>
          <option value="Hockey">Hockey</option>
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
        <Select value={signalFilter} onChange={(event) => setSignalFilter(event.target.value)}>
          <option value="all">All signal states</option>
          <option value="yes">Has signal</option>
          <option value="no">No signal</option>
        </Select>
        <Select value={ageRange} onChange={(event) => setAgeRange(event.target.value)}>
          <option value="all">All ages</option>
          <option value="under18">Under 18</option>
          <option value="18to23">18 to 23</option>
        </Select>
      </div>
      <div className="overflow-hidden rounded-[24px] border border-[#D3D1C7] bg-white">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-[#F1EFE8]">
            <tr>
              {["Avatar", "Name", "Sport", "Tier", "State", "Current Risk", "Assigned Coach", "Last Medical Check", "Actions"].map((header) => (
                <th key={header} className="px-4 py-3 font-semibold">{header}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((athlete) => {
              const risk = getRiskForAthlete(athlete.id);
              return (
                <tr key={athlete.id} className="border-t border-[#F1EFE8]">
                  <td className="px-4 py-3"><SharedComponents.Avatar name={athlete.name} /></td>
                  <td className="px-4 py-3"><Link href={`/athletes/${athlete.id}`} className="font-semibold text-[#3C3489]">{athlete.name}</Link></td>
                  <td className="px-4 py-3">{getSportName(athlete.sport_id)}</td>
                  <td className="px-4 py-3 capitalize">{athlete.tier}</td>
                  <td className="px-4 py-3">{athlete.state}</td>
                  <td className="px-4 py-3"><SharedComponents.Badge label={risk?.risk_level ?? "unknown"} variant={risk?.risk_level === "critical" ? "danger" : risk?.risk_level === "high" ? "warning" : "success"} /></td>
                  <td className="px-4 py-3">{assignedCoaches[athlete.id]}</td>
                  <td className="px-4 py-3">{lastMedicalChecks[athlete.id]}</td>
                  <td className="px-4 py-3"><Link href={`/athletes/${athlete.id}`} className="text-[#534AB7]">View</Link></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
