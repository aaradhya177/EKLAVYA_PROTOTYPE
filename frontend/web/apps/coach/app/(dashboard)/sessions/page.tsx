import { Card } from "@/components/ui/card";
import { sessions } from "@/lib/mock-data";
import { getSportName } from "@/lib/utils";

export default function SessionsPage() {
  return (
    <Card className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold">All sessions</h1>
        <p className="text-sm text-[#5F5E5A]">Track all team sessions across sports and athletes.</p>
      </div>
      <div className="space-y-3">
        {sessions.map((session) => (
          <div key={session.id} className="rounded-2xl bg-[#F1EFE8] px-4 py-3">
            <div className="flex items-center justify-between">
              <p className="font-semibold capitalize">
                {session.session_type} · {getSportName(session.sport_id)}
              </p>
              <p className="text-sm">RPE {session.rpe}</p>
            </div>
            <p className="text-xs text-[#5F5E5A]">{session.start_time}</p>
          </div>
        ))}
      </div>
    </Card>
  );
}
