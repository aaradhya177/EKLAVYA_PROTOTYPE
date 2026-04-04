import Link from "next/link";

import { Card } from "@/components/ui/card";
import { useSportAnalyticsQuery } from "@/hooks/use-federation-data";

export default function SportsPage() {
  const query = useSportAnalyticsQuery();
  if (!query.data) {
    return <div>Loading...</div>;
  }

  return (
    <Card className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold">Sport analytics</h1>
        <p className="text-sm text-[#5F5E5A]">Sport-by-sport federation analytics with drill-downs.</p>
      </div>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {query.data.map((entry) => (
          <Link key={entry.sport.id} href={`/sports/${entry.sport.id}`} className="rounded-[24px] bg-[#F1EFE8] p-5">
            <p className="text-lg font-bold">{entry.sport.name}</p>
            <p className="mt-2 text-sm text-[#5F5E5A]">{entry.athleteCount} athletes</p>
          </Link>
        ))}
      </div>
    </Card>
  );
}
