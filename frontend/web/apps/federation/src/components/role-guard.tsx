"use client";

import { usePathname, useRouter } from "next/navigation";
import { PropsWithChildren, useEffect } from "react";

type RoleGuardProps = PropsWithChildren<{
  token?: string | null;
  role?: string | null;
}>;

export function RoleGuard({ children, token = "federation-access-token", role = "federation_admin" }: RoleGuardProps) {
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!token) {
      router.replace("/login");
      return;
    }
    if (role !== "federation_admin" && pathname !== "/access-denied") {
      router.replace("/access-denied");
    }
  }, [pathname, role, router, token]);

  if (!token) {
    return null;
  }
  if (role !== "federation_admin") {
    return <div className="grid min-h-screen place-items-center text-lg font-semibold">Access Denied</div>;
  }
  return <>{children}</>;
}
