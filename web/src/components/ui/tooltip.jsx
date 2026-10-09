"use client";
// shadcn/ui v4 Tooltip, restyled: small ink label in mono.
import { Tooltip as TooltipPrimitive } from "radix-ui";
import { cn } from "@/lib/utils";

const TooltipProvider = ({ delayDuration = 150, ...props }) => <TooltipPrimitive.Provider delayDuration={delayDuration} {...props} />;
const Tooltip = (props) => <TooltipPrimitive.Root data-slot="tooltip" {...props} />;
const TooltipTrigger = (props) => <TooltipPrimitive.Trigger data-slot="tooltip-trigger" {...props} />;

function TooltipContent({ className, sideOffset = 6, children, ...props }) {
  return (
    <TooltipPrimitive.Portal>
      <TooltipPrimitive.Content
        data-slot="tooltip-content"
        sideOffset={sideOffset}
        className={cn(
          "z-50 w-fit max-w-xs origin-(--radix-tooltip-content-transform-origin) rounded-[10px] bg-foreground px-3 py-1.5 font-mono text-[11px] tracking-[0.04em] text-background",
          "animate-in fade-in-0 zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95",
          className,
        )}
        {...props}
      >
        {children}
        <TooltipPrimitive.Arrow className="fill-foreground" />
      </TooltipPrimitive.Content>
    </TooltipPrimitive.Portal>
  );
}

export { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider };
