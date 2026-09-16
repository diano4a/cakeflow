import { cn } from "cn";

import { isOrderStatus } from "@/features/orders/types";

export const STATUS_TONES = [
  "draft",
  "submitted",
  "accepted",
  "in_production",
  "ready",
  "completed",
  "cancelled",
  "overdue",
] as const;

export type StatusTone = (typeof STATUS_TONES)[number];

const TONE_CLASS: Record<StatusTone, string> = {
  draft: "bg-status-draft",
  submitted: "bg-status-submitted",
  accepted: "bg-status-accepted",
  in_production: "bg-status-in-production",
  ready: "bg-status-ready",
  completed: "bg-status-completed",
  cancelled: "bg-status-cancelled",
  overdue: "bg-status-overdue",
};

/** Overdue (a deadline condition) takes the indicator; lifecycle text stays. */
export function statusToneFor(status: string, overdue: boolean): StatusTone {
  if (overdue) {
    return "overdue";
  }
  return isOrderStatus(status) ? status : "completed";
}

/**
 * Small circular status marker. Color is supplementary; the visible status
 * label on the card remains the source of meaning.
 */
export function StatusDot({
  tone,
  label,
}: {
  tone: StatusTone;
  label: string;
}) {
  return (
    <span
      role="img"
      aria-label={label}
      title={label}
      className={cn("status-dot", TONE_CLASS[tone])}
    />
  );
}
