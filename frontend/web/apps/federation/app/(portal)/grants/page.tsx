"use client";

import { useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Select } from "@/components/ui/select";
import { useGrantsQuery } from "@/hooks/use-federation-data";
import { athletes } from "@/lib/mock-data";
import { getSportName } from "@/lib/utils";

export default function GrantsPage() {
  const query = useGrantsQuery();
  const [scheme, setScheme] = useState("all");
  const [selectedIds, setSelectedIds] = useState<number[]>([]);

  if (!query.data) {
    return <div>Loading...</div>;
  }

  const filtered = useMemo(() => query.data.grants.filter((grant) => scheme === "all" || grant.grant_scheme === scheme), [query.data.grants, scheme]);
  const totalDisbursed = filtered.reduce((sum, grant) => sum + Number(grant.amount), 0);
  const upcoming = filtered.filter((grant) => grant.next_disbursement_date && grant.next_disbursement_date <= "2025-04-30");

  return (
    <div className="space-y-6">
      <Card className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Grant management</h1>
            <p className="text-sm text-[#5F5E5A]">Manage disbursements, eligibility, and federation scheme coverage.</p>
          </div>
          <div className="flex items-center gap-3">
            <Select value={scheme} onChange={(event) => setScheme(event.target.value)}>
              <option value="all">All schemes</option>
              <option value="TOPS">TOPS</option>
              <option value="KheloIndia">Khelo India</option>
              <option value="StateGovt">State</option>
            </Select>
            <Button>Bulk disburse</Button>
          </div>
        </div>
        <div className="rounded-[24px] bg-[#26215C] p-5 text-white">
          <p className="text-sm text-[#CECBF6]">Total disbursed this fiscal year</p>
          <p className="mt-3 text-3xl font-bold">₹{totalDisbursed.toLocaleString("en-IN")}</p>
        </div>
      </Card>

      <Card className="space-y-4">
        <h2 className="text-xl font-bold">Grant records</h2>
        <div className="overflow-hidden rounded-[24px] border border-[#D3D1C7] bg-white">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-[#F1EFE8]">
              <tr>
                {["", "Athlete", "Scheme", "Amount", "Upcoming", "Sport"].map((header) => (
                  <th key={header} className="px-4 py-3 font-semibold">{header}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((grant) => {
                const athlete = athletes.find((item) => item.id === grant.athlete_id);
                return (
                  <tr key={grant.id} className="border-t border-[#F1EFE8]">
                    <td className="px-4 py-3"><input type="checkbox" checked={selectedIds.includes(grant.id)} onChange={(event) => setSelectedIds((state) => event.target.checked ? [...state, grant.id] : state.filter((id) => id !== grant.id))} /></td>
                    <td className="px-4 py-3">{athlete?.name}</td>
                    <td className="px-4 py-3">{grant.grant_scheme}</td>
                    <td className="px-4 py-3">₹{Number(grant.amount).toLocaleString("en-IN")}</td>
                    <td className="px-4 py-3">{grant.next_disbursement_date ?? "-"}</td>
                    <td className="px-4 py-3">{getSportName(athlete?.sport_id ?? 1)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>

      <div className="grid gap-6 xl:grid-cols-2">
        <Card className="space-y-4">
          <h2 className="text-xl font-bold">Upcoming disbursements (30 days)</h2>
          <div className="space-y-3">
            {upcoming.map((grant) => (
              <div key={grant.id} className="rounded-2xl bg-[#F1EFE8] px-4 py-3">
                <p className="font-semibold">{athletes.find((item) => item.id === grant.athlete_id)?.name}</p>
                <p className="text-xs text-[#5F5E5A]">{grant.next_disbursement_date}</p>
              </div>
            ))}
          </div>
        </Card>
        <Card className="space-y-4">
          <h2 className="text-xl font-bold">Eligible without grant</h2>
          <div className="space-y-3">
            {query.data.eligible.map((athlete) => (
              <div key={athlete.id} className="rounded-2xl bg-[#F1EFE8] px-4 py-3">
                <p className="font-semibold">{athlete.name}</p>
                <p className="text-xs text-[#5F5E5A]">{athlete.state} · {getSportName(athlete.sport_id)}</p>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
