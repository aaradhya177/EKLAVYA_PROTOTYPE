"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { useFederationStore } from "@/stores";
import { classNames } from "@/lib/utils";

const items = [
  { href: "/", label: "Overview", icon: "O" },
  { href: "/athletes", label: "Athletes", icon: "A" },
  { href: "/talent", label: "Talent", icon: "T" },
  { href: "/sports", label: "Sports", icon: "S" },
  { href: "/grants", label: "Grants", icon: "G" },
  { href: "/reports", label: "Reports", icon: "R" },
  { href: "/compliance", label: "Compliance", icon: "C" },
  { href: "/settings", label: "Settings", icon: "⚙" }
];

export function Sidebar() {
  const pathname = usePathname();
  const profile = useFederationStore((state) => state.profile);

  return (
    <aside className="sticky top-0 h-screen w-72 border-r border-[#D3D1C7] bg-[#26215C] p-4 text-white">
      <div className="rounded-[24px] bg-[#3C3489] p-4">
        <p className="text-lg font-bold">AthleteOS</p>
        <p className="text-sm text-[#CECBF6]">{profile.name}</p>
        <p className="text-xs text-[#CECBF6]">Federation portal</p>
      </div>
      <nav className="mt-6 flex flex-col gap-2">
        {items.map((item) => {
          const active = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));
          return (
            <Link key={item.href} href={item.href} className={classNames("flex items-center gap-3 rounded-2xl px-4 py-3", active ? "bg-white text-[#26215C]" : "text-[#CECBF6]")}>
              <span className="grid h-8 w-8 place-items-center rounded-full bg-white/10 text-sm font-bold">{item.icon}</span>
              <span className="font-semibold">{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
