import { Card } from "@/components/ui/card";
import { talentBoard } from "@/lib/mock-data";

export default function EmergingTalentPage() {
  return (
    <Card className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold">Emerging athletes</h1>
        <p className="text-sm text-[#5F5E5A]">Focused review list for the earliest stage of the talent pipeline.</p>
      </div>
      <div className="space-y-3">
        {talentBoard.filter((athlete) => athlete.tier === "Emerging").map((athlete) => (
          <div key={athlete.athleteId} className="rounded-2xl bg-[#F1EFE8] px-4 py-3">
            <p className="font-semibold">{athlete.name}</p>
            <p className="text-xs text-[#5F5E5A]">{athlete.sport} · {athlete.recentSignal}</p>
          </div>
        ))}
      </div>
    </Card>
  );
}
