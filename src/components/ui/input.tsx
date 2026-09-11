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
        "h-control w-full min-w-0 border-0 border-b border-hairline bg-transparent font-sans text-body text-ink transition-colors placeholder:text-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink focus-visible:border-b-ink disabled:cursor-not-allowed disabled:opacity-40 aria-invalid:divider-b",
        className,
      )}
      {...props}
    />
  );
}

export { Input };
