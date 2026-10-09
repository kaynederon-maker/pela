// shadcn/ui v4 Button, restyled for Pela: printed-paper buttons that press down instead of glowing.
import { cva } from "class-variance-authority";
import { Slot } from "radix-ui";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "relative inline-flex shrink-0 cursor-pointer items-center justify-center gap-2 whitespace-nowrap font-semibold tracking-[-0.01em] outline-none select-none " +
    "transition-[transform,box-shadow,background-color,color,border-color] duration-200 ease-[var(--ease-press)] " +
    "active:translate-y-[2px] active:shadow-none " +
    "focus-visible:ring-[3px] focus-visible:ring-ring/45 focus-visible:ring-offset-2 focus-visible:ring-offset-background " +
    "disabled:pointer-events-none disabled:opacity-45 aria-invalid:ring-destructive/30 " +
    "[&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-[18px]",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground shadow-[0_2px_0_0_var(--primary-shadow),inset_0_1px_0_rgb(255_255_255/0.22)] hover:-translate-y-px hover:shadow-[0_3px_0_0_var(--primary-shadow),inset_0_1px_0_rgb(255_255_255/0.22)]",
        ink: "bg-foreground text-background shadow-[0_2px_0_0_rgb(0_0_0/0.35)] hover:-translate-y-px hover:bg-foreground/92",
        outline:
          "border-[1.5px] border-foreground/85 bg-card text-foreground shadow-[0_2px_0_0_var(--foreground)] hover:-translate-y-px hover:bg-accent",
        ghost: "text-foreground hover:bg-foreground/[0.06]",
        destructive:
          "border-[1.5px] border-destructive/60 bg-card text-destructive shadow-[0_2px_0_0_var(--destructive)] hover:bg-destructive hover:text-white",
        link: "h-auto px-0 text-primary-ink underline decoration-primary/40 decoration-2 underline-offset-[5px] hover:decoration-primary active:translate-y-0",
      },
      size: {
        default: "h-11 rounded-[14px] px-5 text-[15px]",
        sm: "h-9 rounded-[12px] px-3.5 text-sm [&_svg:not([class*='size-'])]:size-4",
        lg: "h-14 rounded-[18px] px-7 text-base",
        pill: "h-11 rounded-full px-5 text-[15px]",
        icon: "size-11 rounded-full",
        "icon-sm": "size-9 rounded-full [&_svg:not([class*='size-'])]:size-4",
      },
    },
    defaultVariants: { variant: "default", size: "default" },
  },
);

function Button({ className, variant = "default", size = "default", asChild = false, ...props }) {
  const Comp = asChild ? Slot.Root : "button";
  return (
    <Comp
      data-slot="button"
      data-variant={variant}
      data-size={size}
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  );
}

export { Button, buttonVariants };
