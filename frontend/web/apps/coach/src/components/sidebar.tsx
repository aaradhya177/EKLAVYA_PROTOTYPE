"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

import { useAlertStore, useCoachStore } from "@/stores";
import { classNames } from "@/lib/utils";

const items = [
  { href: "/athletes", label: "Athletes", icon: "A" },
  { href: "/sessions", label: "Sessions", icon: "S" },
  { href: "/alerts", label: "Alerts", icon: "!" },
  { href: "/plans", label: "Plans", icon: "P" },
  { href: "/files", label: "Files", icon: "F" },
  { href: "/settings", label: "Settings", icon: "⚙" }
];

export function Sidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const profile = useCoachStore((state) => state.profile);
  const unread = useAlertStore((state) => state.activeAlerts.filter((alert) => !alert.reviewed).length);

  return (
    <aside className={classNames("sticky top-0 h-screen border-r border-[#D3D1C7] bg-[#26215C] p-4 text-white", collapsed ? "w-24" : "w-72")}>
      <div className="flex h-full flex-col gap-6">
        <div className="rounded-[24px] bg-[#3C3489] p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-lg font-bold">AthleteOS</p>
              {!collapsed ? <p className="text-sm text-[#CECBF6]">{profile.name}</p> : null}
              {!collapsed ? <p className="text-xs text-[#CECBF6]">{profile.sport}</p> : null}
            </div>
            <button className="rounded-full bg-white/10 px-3 py-1 text-xs" onClick={() => setCollapsed((value) => !value)}>
              {collapsed ? ">" : "<"}
            </button>
          </div>
        </div>
        <nav className="flex flex-1 flex-col gap-2">
          <Link href="/" className={classNames("flex items-center gap-3 rounded-2xl px-4 py-3", pathname === "/" ? "bg-white text-[#26215C]" : "text-[#CECBF6]")}>
            <span className="grid h-8 w-8 place-items-center rounded-full bg-white/10">O</span>
            {!collapsed ? <span className="font-semibold">Overview</span> : null}
          </Link>
          {items.map((item) => {
            const active = pathname.startsWith(item.href);
            return (
              <Link key={item.href} href={item.href} className={classNames("flex items-center gap-3 rounded-2xl px-4 py-3", active ? "bg-white text-[#26215C]" : "text-[#CECBF6]")}>
                <span className="grid h-8 w-8 place-items-center rounded-full bg-white/10 text-sm font-bold">{item.icon}</span>
                {!collapsed ? <span className="font-semibold">{item.label}</span> : null}
                {!collapsed && item.href === "/alerts" && unread > 0 ? (
                  <span className="ml-auto rounded-full bg-[#E24B4A] px-2 py-1 text-xs text-white">{unread}</span>
                ) : null}
              </Link>
            );
          })}
        </nav>
      </div>
    </aside>
  );
}
