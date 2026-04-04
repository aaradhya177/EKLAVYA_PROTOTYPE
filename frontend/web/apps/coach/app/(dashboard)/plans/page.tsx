import Link from "next/link";

import { Card } from "@/components/ui/card";
import { athletes, developmentPlans } from "@/lib/mock-data";

export default function PlansPage() {
  return (
    <Card className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold">Development plans</h1>
        <p className="text-sm text-[#5F5E5A]">Review every athlete plan and jump into the builder.</p>
      </div>
      <div className="space-y-3">
        {athletes.map((athlete) => {
          const plan = developmentPlans[athlete.id];
          return (
            <Link key={athlete.id} href={`/plans/${athlete.id}`} className="block rounded-2xl bg-[#F1EFE8] px-4 py-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold">{athlete.name}</p>
                  <p className="text-xs text-[#5F5E5A]">{plan?.periodization_blocks.length ?? 0} blocks</p>
                </div>
                <span className="text-sm font-semibold text-[#534AB7]">Open builder</span>
              </div>
            </Link>
          );
        })}
      </div>
    </Card>
  );
}
