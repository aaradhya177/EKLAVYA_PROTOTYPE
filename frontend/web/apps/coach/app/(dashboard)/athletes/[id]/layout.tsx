import Link from "next/link";
import { PropsWithChildren } from "react";

const tabs = [
  { href: "", label: "Overview" },
  { href: "/sessions", label: "Sessions" },
  { href: "/injury", label: "Injury" },
  { href: "/career", label: "Career" }
];

export default function AthleteDetailLayout({ children, params }: PropsWithChildren<{ params: { id: string } }>) {
  return (
    <div className="space-y-4">
      <div className="flex gap-2 rounded-[24px] bg-white p-2">
        {tabs.map((tab) => (
          <Link
            key={tab.label}
            href={`/athletes/${params.id}${tab.href}`}
            className="rounded-full px-4 py-2 text-sm font-semibold text-[#444441] hover:bg-[#F1EFE8]"
          >
            {tab.label}
          </Link>
        ))}
      </div>
      {children}
    </div>
  );
}
