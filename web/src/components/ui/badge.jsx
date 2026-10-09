// shadcn/ui v4 Badge, restyled as small inked chips (mono, dashed "stamp" variant).
import { cva } from "class-variance-authority";
import { Slot } from "radix-ui";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex w-fit shrink-0 items-center justify-center gap-1.5 overflow-hidden rounded-full font-mono text-[11px] font-medium tracking-[0.08em] whitespace-nowrap uppercase [&>svg]:size-3 [&>svg]:pointer-events-none",
  {
    variants: {
      variant: {
        default: "bg-primary px-2.5 py-1 text-primary-foreground",
        soft: "bg-accent px-2.5 py-1 text-accent-foreground",
        outline: "border border-foreground/25 px-2.5 py-[3px] text-foreground",
        muted: "bg-foreground/[0.06] px-2.5 py-1 text-muted-foreground",
        stamp: "-rotate-2 rounded-md border-[1.5px] border-dashed border-current px-2 py-[3px] text-primary-ink",
      },
    },
    defaultVariants: { variant: "default" },
  },
);

function Badge({ className, variant = "default", asChild = false, ...props }) {
  const Comp = asChild ? Slot.Root : "span";
  return <Comp data-slot="badge" data-variant={variant} className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
