import { Card } from "@/components/ui/card";
import { grants } from "@/lib/mock-data";

export default function DisbursementsPage() {
  return (
    <Card className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold">Grant disbursements</h1>
        <p className="text-sm text-[#5F5E5A]">Quick ledger of all recent and upcoming disbursement events.</p>
      </div>
      <div className="space-y-3">
        {grants.map((grant) => (
          <div key={grant.id} className="rounded-2xl bg-[#F1EFE8] px-4 py-3">
            <p className="font-semibold">{grant.grant_scheme}</p>
            <p className="text-xs text-[#5F5E5A]">Disbursed {grant.disbursed_at} · next {grant.next_disbursement_date}</p>
          </div>
        ))}
      </div>
    </Card>
  );
}
