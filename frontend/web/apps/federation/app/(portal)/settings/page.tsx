import { Card } from "@/components/ui/card";
import { federationProfile } from "@/lib/mock-data";

export default function SettingsPage() {
  return (
    <div className="grid gap-6 xl:grid-cols-2">
      <Card className="space-y-4">
        <h1 className="text-2xl font-bold">Federation settings</h1>
        <div className="space-y-2">
          <p className="text-sm text-[#5F5E5A]">Profile</p>
          <p className="font-semibold">{federationProfile.name}</p>
          <p className="text-sm text-[#5F5E5A]">Role</p>
          <p className="font-semibold capitalize">{federationProfile.role.replace("_", " ")}</p>
        </div>
      </Card>
      <Card className="space-y-4">
        <h2 className="text-xl font-bold">Notification preferences</h2>
        <div className="space-y-3 text-sm">
          <label className="flex items-center justify-between rounded-2xl bg-[#F1EFE8] px-4 py-3">
            Critical risk alerts
            <input type="checkbox" defaultChecked />
          </label>
          <label className="flex items-center justify-between rounded-2xl bg-[#F1EFE8] px-4 py-3">
            Weekly talent digest
            <input type="checkbox" defaultChecked />
          </label>
        </div>
      </Card>
    </div>
  );
}
