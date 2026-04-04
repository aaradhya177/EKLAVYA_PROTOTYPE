"use client";

import { format } from "date-fns";

import { useCoachStore } from "@/stores";

export function Topbar() {
  const profile = useCoachStore((state) => state.profile);
  return (
    <header className="flex items-center justify-between rounded-[24px] border border-[#D3D1C7] bg-white px-6 py-4">
      <div>
        <p className="text-sm text-[#5F5E5A]">Coach Dashboard</p>
        <h1 className="text-2xl font-bold text-[#2C2C2A]">{profile.name}</h1>
      </div>
      <div className="text-right">
        <p className="text-sm font-semibold text-[#3C3489]">{profile.sport}</p>
        <p className="text-xs text-[#5F5E5A]">{format(new Date(), "EEE, dd MMM yyyy")}</p>
      </div>
    </header>
  );
}
