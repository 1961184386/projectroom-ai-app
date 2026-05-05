"use client";

import { CircleHelp, CircleCheckBig } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function ConfirmationToggle({
  confirmed,
  isSubmitting = false,
  onClick
}: {
  confirmed: boolean;
  isSubmitting?: boolean;
  onClick?: () => void;
}) {
  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      disabled={isSubmitting || !onClick}
      onClick={onClick}
      className={cn(
        "h-8 gap-1 rounded-full border px-3 text-xs font-semibold",
        confirmed
          ? "border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
          : "border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100"
      )}
    >
      {confirmed ? <CircleCheckBig className="h-3.5 w-3.5" /> : <CircleHelp className="h-3.5 w-3.5" />}
      {isSubmitting ? "提交中" : confirmed ? "已确认" : "待确认"}
    </Button>
  );
}
