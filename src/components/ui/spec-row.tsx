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
 * The recipe-sheet row: label and value on a hairline. From `sm` up, rows in
 * a SpecList share one label column via subgrid so a long Ukrainian label
 * widens every row instead of overlapping the value. Short English labels
 * still sit on the 78px floor. Below `sm` the pair stacks.
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
        "hairline-b grid grid-cols-1 gap-y-cluster py-row-y sm:col-span-full sm:grid-cols-subgrid sm:items-baseline sm:gap-y-0",
        className,
      )}
    >
      <span className="type-label sm:whitespace-nowrap sm:pt-[0.2em]">
        {label}
      </span>
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
    <div
      className={cn(
        "hairline-t grid grid-cols-1 sm:grid-cols-[minmax(var(--spacing-spec-label),max-content)_minmax(0,1fr)] sm:gap-x-layout",
        className,
      )}
    >
      {children}
    </div>
  );
}
