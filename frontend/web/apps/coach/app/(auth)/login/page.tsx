"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { coachApi } from "@/lib/api";

export default function LoginPage() {
  const router = useRouter();
  const schema = useMemo(
    () =>
      z.object({
        email: z.string().email("Enter a valid email"),
        password: z.string().min(8, "Password must be at least 8 characters")
      }),
    []
  );
  const [email, setEmail] = useState("coach@athleteos.in");
  const [password, setPassword] = useState("password123");
  const [errors, setErrors] = useState<Record<string, string>>({});

  return (
    <main className="grid min-h-screen place-items-center bg-[#F1EFE8] p-6">
      <Card className="w-full max-w-md space-y-5">
        <div className="space-y-2">
          <p className="text-sm text-[#5F5E5A]">AthleteOS</p>
          <h1 className="text-3xl font-bold text-[#26215C]">Coach login</h1>
        </div>
        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-semibold">Email</label>
            <Input value={email} onChange={(event) => setEmail(event.target.value)} />
            {errors.email ? <p className="text-xs text-[#A32D2D]">{errors.email}</p> : null}
          </div>
          <div className="space-y-2">
            <label className="text-sm font-semibold">Password</label>
            <Input type="password" value={password} onChange={(event) => setPassword(event.target.value)} />
            {errors.password ? <p className="text-xs text-[#A32D2D]">{errors.password}</p> : null}
          </div>
          <Button
            className="w-full"
            onClick={async () => {
              const parsed = schema.safeParse({ email, password });
              if (!parsed.success) {
                setErrors(
                  parsed.error.issues.reduce<Record<string, string>>((acc, issue) => {
                    acc[String(issue.path[0] ?? "form")] = issue.message;
                    return acc;
                  }, {})
                );
                return;
              }
              setErrors({});
              await coachApi.login(email);
              router.push("/");
            }}
          >
            Sign in
          </Button>
        </div>
      </Card>
    </main>
  );
}
