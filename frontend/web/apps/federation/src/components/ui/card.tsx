import { PropsWithChildren } from "react";

import { classNames } from "@/lib/utils";

export function Card({ children, className }: PropsWithChildren<{ className?: string }>) {
  return <div className={classNames("rounded-[24px] border border-[#D3D1C7] bg-white p-5 shadow-panel", className)}>{children}</div>;
}
