"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useAlertsQuery } from "@/hooks/use-coach-data";
import { filterAlerts, getAlertsSince } from "@/lib/utils";
import { useAlertStore } from "@/stores";
import { SharedComponents } from "@/shared";

export default function AlertsPage() {
  const alertsQuery = useAlertsQuery();
  const [criticalOnly, setCriticalOnly] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const { activeAlerts, setAlerts, acknowledgeMany, lastChecked, updateLastChecked } = useAlertStore();
  const previousCritical = useRef<string[]>([]);

  useEffect(() => {
    if (alertsQuery.data) {
      setAlerts(alertsQuery.data);
      const freshCritical = getAlertsSince(alertsQuery.data, lastChecked).filter((alert) => alert.riskLevel === "critical");
      if (typeof window !== "undefined" && "Notification" in window) {
        void Notification.requestPermission().then((permission) => {
          if (permission === "granted") {
            freshCritical.forEach((alert) => {
              if (!previousCritical.current.includes(alert.id)) {
                new Notification(`Critical alert: ${alert.athleteName}`, { body: alert.topFactor });
              }
            });
            previousCritical.current = freshCritical.map((alert) => alert.id);
          }
        });
      }
      updateLastChecked(new Date().toISOString());
    }
  }, [alertsQuery.data, lastChecked, setAlerts, updateLastChecked]);

  const filtered = useMemo(() => filterAlerts(activeAlerts, criticalOnly), [activeAlerts, criticalOnly]);

  return (
    <Card className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Active risk alerts</h1>
          <p className="text-sm text-[#5F5E5A]">Live polling refreshes every 60 seconds.</p>
        </div>
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={criticalOnly} onChange={(event) => setCriticalOnly(event.target.checked)} />
            Critical only
          </label>
          <Button variant="secondary" onClick={() => acknowledgeMany(selectedIds)}>
            Bulk acknowledge
          </Button>
        </div>
      </div>
      <div className="overflow-hidden rounded-[24px] border border-[#D3D1C7] bg-white">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-[#F1EFE8]">
            <tr>
              {["", "Athlete", "Risk Level", "Score", "Top Factor", "Time", "Actions"].map((header) => (
                <th key={header} className="px-4 py-3 font-semibold">
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((alert) => (
              <tr key={alert.id} className="border-t border-[#F1EFE8]">
                <td className="px-4 py-3">
                  <input
                    type="checkbox"
                    checked={selectedIds.includes(alert.id)}
                    onChange={(event) =>
                      setSelectedIds((state) => (event.target.checked ? [...state, alert.id] : state.filter((item) => item !== alert.id)))
                    }
                  />
                </td>
                <td className="px-4 py-3">{alert.athleteName}</td>
                <td className="px-4 py-3">
                  <SharedComponents.Badge label={alert.riskLevel} variant={alert.riskLevel === "critical" ? "danger" : "warning"} />
                </td>
                <td className="px-4 py-3">{alert.score.toFixed(2)}</td>
                <td className="px-4 py-3">{alert.topFactor}</td>
                <td className="px-4 py-3">{alert.time}</td>
                <td className="px-4 py-3">
                  <Link href={`/athletes/${alert.athleteId}/injury`} className="text-[#534AB7]">
                    Open injury tab
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
