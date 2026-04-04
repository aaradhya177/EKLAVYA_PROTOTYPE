import { Card } from "@/components/ui/card";
import { coachProfile } from "@/lib/mock-data";

export default function SettingsPage() {
  return (
    <div className="grid gap-6 xl:grid-cols-2">
      <Card className="space-y-4">
        <h1 className="text-2xl font-bold">Coach profile</h1>
        <div className="space-y-2">
          <p className="text-sm text-[#5F5E5A]">Name</p>
          <p className="font-semibold">{coachProfile.name}</p>
          <p className="text-sm text-[#5F5E5A]">Primary sport</p>
          <p className="font-semibold">{coachProfile.sport}</p>
        </div>
      </Card>
      <Card className="space-y-4">
        <h2 className="text-xl font-bold">Preferences</h2>
        <div className="space-y-3 text-sm">
          <label className="flex items-center justify-between rounded-2xl bg-[#F1EFE8] px-4 py-3">
            Critical browser notifications
            <input type="checkbox" defaultChecked />
          </label>
          <label className="flex items-center justify-between rounded-2xl bg-[#F1EFE8] px-4 py-3">
            Daily digest email
            <input type="checkbox" defaultChecked />
          </label>
        </div>
      </Card>
    </div>
  );
}
