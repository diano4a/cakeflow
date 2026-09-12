import * as React from "react";
import { cn } from "cn";

function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        "type-body field-sizing-content flex min-h-20 w-full border-0 border-b border-hairline bg-transparent py-2 transition-colors placeholder:text-muted placeholder:[-webkit-text-fill-color:var(--color-muted)] [-webkit-text-fill-color:var(--color-ink)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink focus-visible:border-b-ink disabled:cursor-not-allowed disabled:opacity-40 disabled:[-webkit-text-fill-color:var(--color-muted)] aria-invalid:divider-b",
        className,
      )}
      {...props}
    />
  );
}

export { Textarea };
