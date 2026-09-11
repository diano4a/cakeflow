import type { ReactNode } from "react";
import { cn } from "cn";

type SpecRowProps = {
  /** Already-localized label text. Shared primitives never hold copy. */
  label: ReactNode;
  children: ReactNode;
  /** Renders the value with the mono data role, for dates, prices and IDs. */
  data?: boolean;
  className?: string;
};

/**
 * The recipe-sheet row: a fixed 78px label column, a flexible value column and
 * a hairline underneath. Below 400px the columns stack so the value keeps a
 * usable measure at a 380px viewport.
 */
export function SpecRow({
  label,
  children,
  data = false,
  className,
}: SpecRowProps) {
  return (
    <div
      className={cn(
        "hairline-b grid gap-1 py-row-y min-[400px]:grid-cols-[var(--spacing-spec-label)_1fr] min-[400px]:items-baseline min-[400px]:gap-x-spec-gap min-[400px]:gap-y-0",
        className,
      )}
    >
      <span className="type-label min-[400px]:pt-[0.2em]">{label}</span>
      <span className={data ? "type-data" : "type-value"}>{children}</span>
    </div>
  );
}

/** Wraps a run of spec rows and closes the group with a top hairline. */
export function SpecList({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("hairline-t", className)}>{children}</div>
  );
}
