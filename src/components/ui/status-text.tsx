import type { ReactNode } from "react";
import { cn } from "cn";

type StatusTextProps = {
  /** Already-localized status label. */
  children: ReactNode;
  /**
   * Emphasis, never hue. `strong` for the state that needs attention,
   * `quiet` for settled or inactive states.
   */
  emphasis?: "default" | "strong" | "quiet";
  className?: string;
};

/**
 * Status is communicated through typography weight and case rather than
 * color, so there are no pills and no status palette.
 */
export function StatusText({
  children,
  emphasis = "default",
  className,
}: StatusTextProps) {
  return (
    <span
      className={cn(
        "type-label",
        emphasis === "default" && "text-ink",
        emphasis === "strong" && "text-ink font-bold",
        className,
      )}
    >
      {children}
    </span>
  );
}
