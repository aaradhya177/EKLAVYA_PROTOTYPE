import { PropsWithChildren } from "react";

import { RoleGuard } from "@/components/role-guard";
import { Sidebar } from "@/components/sidebar";
import { Topbar } from "@/components/topbar";

export default function PortalLayout({ children }: PropsWithChildren) {
  return (
    <RoleGuard>
      <div className="flex min-h-screen">
        <Sidebar />
        <div className="flex-1 p-6">
          <div className="mx-auto flex max-w-[1680px] flex-col gap-6">
            <Topbar />
            {children}
          </div>
        </div>
      </div>
    </RoleGuard>
  );
}
