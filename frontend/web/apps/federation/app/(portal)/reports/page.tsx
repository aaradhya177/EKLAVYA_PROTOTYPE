"use client";

import { useState } from "react";

import { PDFDownloadLink, SimpleReportDocument, federationApi } from "@/lib/api";
import { useReportsQuery } from "@/hooks/use-federation-data";
import { useReportStore } from "@/stores";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

const templates = [
  { name: "Monthly Performance Summary", format: "pdf" as const },
  { name: "Injury Incidence Report", format: "csv" as const },
  { name: "Talent Pipeline Report", format: "pdf" as const },
  { name: "Financial Disbursement Report", format: "excel" as const }
];

export default function ReportsPage() {
  const query = useReportsQuery();
  const { pendingReports, generatedReports, enqueueReport, completeReport } = useReportStore();
  const [startDate, setStartDate] = useState("2025-03-01");
  const [endDate, setEndDate] = useState("2025-03-31");

  return (
    <div className="space-y-6">
      <Card className="space-y-4">
        <div className="grid gap-3 md:grid-cols-2">
          <Input type="date" value={startDate} onChange={(event) => setStartDate(event.target.value)} />
          <Input type="date" value={endDate} onChange={(event) => setEndDate(event.target.value)} />
        </div>
      </Card>

      <div className="grid gap-4 xl:grid-cols-2">
        {templates.map((template) => (
          <Card key={template.name} className="space-y-3">
            <h2 className="text-lg font-bold">{template.name}</h2>
            <p className="text-sm text-[#5F5E5A]">{startDate} → {endDate}</p>
            {template.format === "pdf" ? (
              <PDFDownloadLink
                document={<SimpleReportDocument title={template.name} lines={[`Range: ${startDate} to ${endDate}`, "Generated client-side"]} />}
                fileName={`${template.name.toLowerCase().replace(/\s+/g, "-")}.pdf`}
              >
                {({ loading }) => <Button variant="secondary">{loading ? "Preparing PDF..." : "Client-side PDF"}</Button>}
              </PDFDownloadLink>
            ) : null}
            <Button
              onClick={async () => {
                const pending = await federationApi.generateReport(template.name, template.format);
                enqueueReport(pending);
                const complete = await federationApi.pollReport(pending.id);
                completeReport(complete);
              }}
            >
              Generate
            </Button>
          </Card>
        ))}
      </div>

      <Card className="space-y-4">
        <h2 className="text-xl font-bold">Pending reports</h2>
        <div className="space-y-3">
          {pendingReports.map((report) => (
            <div key={report.id} className="rounded-2xl bg-[#FAEEDA] px-4 py-3 text-sm text-[#854F0B]">
              {report.name} · {report.status}
            </div>
          ))}
        </div>
      </Card>

      <Card className="space-y-4">
        <h2 className="text-xl font-bold">Generated reports</h2>
        <div className="space-y-3">
          {[...(query.data ?? []), ...generatedReports].map((report) => (
            <div key={`${report.id}-${report.createdAt}`} className="flex items-center justify-between rounded-2xl bg-[#F1EFE8] px-4 py-3">
              <div>
                <p className="font-semibold">{report.name}</p>
                <p className="text-xs text-[#5F5E5A]">{report.createdAt}</p>
              </div>
              <a href={report.downloadUrl ?? "#"} className="text-sm font-semibold text-[#534AB7]">Download</a>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
