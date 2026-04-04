"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { athletes } from "@/lib/mock-data";

export default function LogSessionPage() {
  const router = useRouter();
  const [athleteId, setAthleteId] = useState(athletes[0].id);
  const [sessionType, setSessionType] = useState("training");
  const [startDate, setStartDate] = useState("2025-03-12");

  return (
    <Card className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold">Log session</h1>
        <p className="text-sm text-[#5F5E5A]">Record a new session for any athlete on your squad.</p>
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        <Select value={athleteId} onChange={(event) => setAthleteId(event.target.value)}>
          {athletes.map((athlete) => (
            <option key={athlete.id} value={athlete.id}>
              {athlete.name}
            </option>
          ))}
        </Select>
        <Select value={sessionType} onChange={(event) => setSessionType(event.target.value)}>
          <option value="training">Training</option>
          <option value="competition">Competition</option>
          <option value="recovery">Recovery</option>
        </Select>
        <Input type="date" value={startDate} onChange={(event) => setStartDate(event.target.value)} />
      </div>
      <Button onClick={() => router.push(`/athletes/${athleteId}/sessions`)}>Save and view athlete</Button>
    </Card>
  );
}
