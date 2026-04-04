import { ButtonHTMLAttributes } from "react";

import { classNames } from "@/lib/utils";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost" | "danger";
};

export function Button({ className, variant = "primary", ...props }: ButtonProps) {
  const variantClass =
    variant === "primary"
      ? "bg-[#534AB7] text-white"
      : variant === "secondary"
        ? "bg-white text-[#3C3489] border border-[#CECBF6]"
        : variant === "danger"
          ? "bg-[#E24B4A] text-white"
          : "bg-transparent text-[#444441]";
  return (
    <button
      className={classNames("inline-flex items-center justify-center rounded-full px-4 py-2 text-sm font-semibold transition", variantClass, className)}
      {...props}
    />
  );
}
