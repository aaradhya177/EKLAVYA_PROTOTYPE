import { InputHTMLAttributes } from "react";

import { classNames } from "@/lib/utils";

export function Input(props: InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={classNames("w-full rounded-2xl border border-[#D3D1C7] bg-white px-4 py-3 text-sm text-[#2C2C2A]", props.className)} />;
}
