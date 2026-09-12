import * as React from "react";
import { cn } from "cn";

/**
 * Underlined rather than boxed: a single hairline that thickens to ink on
 * focus and on an invalid value. No fill, no radius, no shadow.
 */
function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        "type-value h-control w-full min-w-0 border-0 border-b border-hairline bg-transparent transition-colors placeholder:text-muted placeholder:[-webkit-text-fill-color:var(--color-muted)] [-webkit-text-fill-color:var(--color-ink)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink focus-visible:border-b-ink disabled:cursor-not-allowed disabled:opacity-40 disabled:[-webkit-text-fill-color:var(--color-muted)] aria-invalid:divider-b [&::-webkit-calendar-picker-indicator]:opacity-70 [&::-webkit-datetime-edit]:text-ink",
        className,
      )}
      {...props}
    />
  );
}

export { Input };
