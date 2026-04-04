"use client";

import * as XLSX from "xlsx";
import { useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Select } from "@/components/ui/select";
import { useComplianceQuery } from "@/hooks/use-federation-data";
import { athletes } from "@/lib/mock-data";
import { complianceSummary, countRevokedConsent } from "@/lib/utils";

export default function CompliancePage() {
  const query = useComplianceQuery();
  const [revokedOnly, setRevokedOnly] = useState(false);
  const [category, setCategory] = useState("all");

  const rows = useMemo(() => {
    const source = query.data ?? [];
    return source.filter((record) => (!revokedOnly || Boolean(record.revokedDate)) && (category === "all" || record.dataCategory === category));
  }, [category, query.data, revokedOnly]);
  const summary = complianceSummary(query.data ?? []);
  const revokedCount = countRevokedConsent(query.data ?? []);
  const noConsentAthletes = athletes.filter((athlete) => !(query.data ?? []).some((record) => record.athleteId === athlete.id));

  return (
    <div className="space-y-6">
      <div className="grid gap-4 lg:grid-cols-4">
        <Card><p className="text-sm text-[#5F5E5A]">% with full consent</p><p className="mt-3 text-3xl font-bold">{summary.fullPercent}%</p></Card>
        <Card><p className="text-sm text-[#5F5E5A]">% with partial consent</p><p className="mt-3 text-3xl font-bold">{summary.partialPercent}%</p></Card>
        <Card><p className="text-sm text-[#5F5E5A]">% revoked financial consent</p><p className="mt-3 text-3xl font-bold">{summary.revokedFinancialPercent}%</p></Card>
        <Card><p className="text-sm text-[#5F5E5A]">No consent on record</p><p className="mt-3 text-3xl font-bold text-[#A32D2D]">{summary.noConsent}</p></Card>
      </div>

      <Card className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex gap-3">
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={revokedOnly} onChange={(event) => setRevokedOnly(event.target.checked)} />
              Revoked only
            </label>
            <Select value={category} onChange={(event) => setCategory(event.target.value)}>
              <option value="all">All categories</option>
              <option value="health">Health</option>
              <option value="financial">Financial</option>
              <option value="performance">Performance</option>
            </Select>
          </div>
          <Button
            variant="secondary"
            onClick={() => {
              const worksheet = XLSX.utils.json_to_sheet(rows);
              const workbook = XLSX.utils.book_new();
              XLSX.utils.book_append_sheet(workbook, worksheet, "Compliance");
              XLSX.writeFile(workbook, "dpdp-audit.xlsx");
            }}
          >
            Export audit
          </Button>
        </div>
        <div className="overflow-hidden rounded-[24px] border border-[#D3D1C7] bg-white">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-[#F1EFE8]">
              <tr>
                {["Athlete", "Data Category", "Consented", "Date", "Revoked Date"].map((header) => (
                  <th key={header} className="px-4 py-3 font-semibold">{header}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((record) => (
                <tr key={record.id} className="border-t border-[#F1EFE8]">
                  <td className="px-4 py-3">{record.athleteName}</td>
                  <td className="px-4 py-3 capitalize">{record.dataCategory}</td>
                  <td className="px-4 py-3">{record.consented ? "Yes" : "No"}</td>
                  <td className="px-4 py-3">{record.date}</td>
                  <td className="px-4 py-3">{record.revokedDate ?? "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="text-sm text-[#5F5E5A]">Revoked consent count: {revokedCount}</p>
      </Card>

      <Card className="space-y-4">
        <h2 className="text-xl font-bold">Flagged athletes with no consent</h2>
        <div className="space-y-3">
          {noConsentAthletes.map((athlete) => (
            <div key={athlete.id} className="rounded-2xl bg-[#FCEBEB] px-4 py-3 text-sm text-[#A32D2D]">
              {athlete.name} has no consent record on file.
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
