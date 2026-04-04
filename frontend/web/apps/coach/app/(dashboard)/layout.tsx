import { PropsWithChildren } from "react";

import { Sidebar } from "@/components/sidebar";
import { Topbar } from "@/components/topbar";

export default function DashboardLayout({ children }: PropsWithChildren) {
  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <div className="flex-1 p-6">
        <div className="mx-auto flex max-w-[1600px] flex-col gap-6">
          <Topbar />
          {children}
        </div>
      </div>
    </div>
  );
}
