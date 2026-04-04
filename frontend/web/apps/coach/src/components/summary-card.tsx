import { Card } from "@/components/ui/card";

export function SummaryCard({ label, value, tone = "default" }: { label: string; value: string | number; tone?: "default" | "danger" }) {
  return (
    <Card className={tone === "danger" ? "border-[#F5C4B3] bg-[#FAECE7]" : ""}>
      <p className="text-sm text-[#5F5E5A]">{label}</p>
      <p className="mt-3 text-3xl font-bold text-[#2C2C2A]">{value}</p>
    </Card>
  );
}
