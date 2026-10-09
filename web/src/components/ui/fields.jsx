// shadcn/ui v4 Input, Textarea and Label, restyled: tall paper fields, mono labels, inline errors.
import { useId } from "react";
import { CircleAlert } from "lucide-react";
import { cn } from "@/lib/utils";

const fieldBase =
  "w-full min-w-0 rounded-[14px] border-[1.5px] border-border bg-card px-4 text-[15px] text-foreground shadow-[inset_0_1px_0_rgb(0_0_0/0.03)] " +
  "transition-[border-color,box-shadow,background-color] duration-200 outline-none placeholder:text-muted-foreground/70 " +
  "hover:border-foreground/30 focus-visible:border-primary focus-visible:bg-background focus-visible:ring-4 focus-visible:ring-primary/15 " +
  "disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-destructive/15 " +
  "selection:bg-primary selection:text-primary-foreground";

function Input({ className, type, ...props }) {
  return <input type={type} data-slot="input" className={cn(fieldBase, "h-[52px]", className)} {...props} />;
}

function Textarea({ className, ...props }) {
  return <textarea data-slot="textarea" className={cn(fieldBase, "min-h-28 resize-y py-3.5 leading-relaxed", className)} {...props} />;
}

function Label({ className, ...props }) {
  return (
    <label
      data-slot="label"
      className={cn("mb-2 flex items-center gap-2 font-mono text-[11px] font-medium tracking-[0.14em] text-muted-foreground uppercase", className)}
      {...props}
    />
  );
}

/** Label above, control, then helper text or an inline error below (with icon). */
function Field({ label, error, hint, as = "input", className, ...props }) {
  const id = useId();
  const Control = as === "textarea" ? Textarea : Input;
  return (
    <div className={cn("block", className)}>
      <Label htmlFor={id}>{label}</Label>
      <Control id={id} aria-invalid={Boolean(error)} aria-describedby={error || hint ? `${id}-note` : undefined} {...props} />
      {(error || hint) && (
        <p id={`${id}-note`} className={cn("mt-1.5 flex items-center gap-1.5 text-[13px]", error ? "text-destructive" : "text-muted-foreground")}>
          {error && <CircleAlert className="size-3.5" aria-hidden />}
          {error ?? hint}
        </p>
      )}
    </div>
  );
}

export { Input, Textarea, Label, Field };
