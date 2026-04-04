import { Card } from "@/components/ui/card";
import { RosterTable } from "@/components/roster-table";

export default function AthletesPage() {
  return (
    <Card className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold">Athlete roster</h1>
        <p className="text-sm text-[#5F5E5A]">Search, filter, sort, and export your full training group.</p>
      </div>
      <RosterTable />
    </Card>
  );
}
