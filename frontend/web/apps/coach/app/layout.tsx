import "./globals.css";

import type { Metadata } from "next";
import { PropsWithChildren } from "react";

import { QueryProvider } from "@/providers/query-provider";

export const metadata: Metadata = {
  title: "AthleteOS Coach Dashboard",
  description: "Coach operations dashboard for AthleteOS"
};

export default function RootLayout({ children }: PropsWithChildren) {
  return (
    <html lang="en">
      <body>
        <QueryProvider>{children}</QueryProvider>
      </body>
    </html>
  );
}
