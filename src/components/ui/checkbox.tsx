"use client";

import * as React from "react";
import { cn } from "cn";
import { Checkbox as CheckboxPrimitive } from "radix-ui";
import { CheckIcon } from "lucide-react";

/**
 * Square by definition, with a monochrome checked state: ink fill, paper mark.
 * The `after` pseudo-element widens the touch target without growing the box.
 */
function Checkbox({
  className,
  ...props
}: React.ComponentProps<typeof CheckboxPrimitive.Root>) {
  return (
    <CheckboxPrimitive.Root
      data-slot="checkbox"
      className={cn(
        "peer relative flex size-[18px] shrink-0 items-center justify-center border border-hairline bg-transparent transition-colors after:absolute focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink after:-inset-x-3 after:-inset-y-3 disabled:cursor-not-allowed disabled:opacity-40 data-checked:border-ink data-checked:bg-ink data-checked:text-paper aria-invalid:border-ink",
        className,
      )}
      {...props}
    >
      <CheckboxPrimitive.Indicator
        data-slot="checkbox-indicator"
        className="grid place-content-center text-current [&>svg]:size-3"
      >
        <CheckIcon strokeWidth={3} />
      </CheckboxPrimitive.Indicator>
    </CheckboxPrimitive.Root>
  );
}

export { Checkbox };
