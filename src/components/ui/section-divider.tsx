import type { ReactNode } from "react";
import { cn } from "cn";

type SectionDividerProps = {
  /** Already-localized section label. Omit for a plain rule. */
  label?: ReactNode;
  /** Ink 1.5px rule instead of a hairline, for major section breaks. */
  strong?: boolean;
  className?: string;
};

/**
 * Hairline separators carry structure in place of boxed cards. With a label
 * the rule becomes a section header.
 */
export function SectionDivider({
  label,
  strong = false,
  className,
}: SectionDividerProps) {
  if (!label) {
    return (
      <hr
        className={cn(
          "border-0",
          strong ? "divider-t" : "hairline-t",
          className,
        )}
      />
    );
  }

  return (
    <div
      className={cn(
        "flex items-baseline gap-spec-gap pt-row-y",
        strong ? "divider-t" : "hairline-t",
        className,
      )}
    >
      <span className="type-label">{label}</span>
    </div>
  );
}
