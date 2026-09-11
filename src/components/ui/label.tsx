"use client";

import * as React from "react";
import { cn } from "cn";
import { Label as LabelPrimitive } from "radix-ui";

/** Field labels use the functional mono label role. */
function Label({
  className,
  ...props
}: React.ComponentProps<typeof LabelPrimitive.Root>) {
  return (
    <LabelPrimitive.Root
      data-slot="label"
      className={cn(
        "type-label flex items-center gap-2 select-none peer-disabled:opacity-40",
        className,
      )}
      {...props}
    />
  );
}

export { Label };
