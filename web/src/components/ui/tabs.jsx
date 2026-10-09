"use client";
// shadcn/ui v4 Tabs, restyled: a paper track with an ink thumb that slides between tabs.
import { Tabs as TabsPrimitive } from "radix-ui";
import { motion } from "framer-motion";
import { createContext, useContext, useId } from "react";
import { cn } from "@/lib/utils";

const TabsCtx = createContext({ value: undefined, id: "" });

function Tabs({ className, value, ...props }) {
  const id = useId();
  return (
    <TabsCtx.Provider value={{ value, id }}>
      <TabsPrimitive.Root data-slot="tabs" value={value} className={cn("flex flex-col gap-5", className)} {...props} />
    </TabsCtx.Provider>
  );
}

function TabsList({ className, ...props }) {
  return (
    <TabsPrimitive.List
      data-slot="tabs-list"
      className={cn("inline-flex w-fit items-center gap-1 rounded-full border border-border bg-card p-1 shadow-[0_2px_0_0_rgb(28_33_30/0.06)]", className)}
      {...props}
    />
  );
}

/** Controlled Tabs get a sliding thumb (layoutId); uncontrolled ones fall back to a static fill. */
function TabsTrigger({ className, children, value, ...props }) {
  const ctx = useContext(TabsCtx);
  const active = ctx.value === value;
  return (
    <TabsPrimitive.Trigger
      data-slot="tabs-trigger"
      value={value}
      className={cn(
        "relative inline-flex h-10 cursor-pointer items-center justify-center gap-2 rounded-full px-4 text-sm font-semibold whitespace-nowrap text-muted-foreground outline-none transition-colors hover:text-foreground",
        "focus-visible:ring-[3px] focus-visible:ring-ring/45 data-[state=active]:text-background [&_svg]:size-4",
        ctx.value === undefined && "data-[state=active]:bg-foreground",
        className,
      )}
      {...props}
    >
      {active && (
        <motion.span
          layoutId={`tab-thumb-${ctx.id}`}
          className="absolute inset-0 rounded-full bg-foreground"
          transition={{ type: "spring", bounce: 0.18, duration: 0.45 }}
        />
      )}
      <span className="relative inline-flex items-center gap-2">{children}</span>
    </TabsPrimitive.Trigger>
  );
}

function TabsContent({ className, ...props }) {
  return (
    <TabsPrimitive.Content
      data-slot="tabs-content"
      className={cn("outline-none data-[state=active]:animate-in data-[state=active]:fade-in-0 data-[state=active]:slide-in-from-bottom-2 data-[state=active]:duration-300", className)}
      {...props}
    />
  );
}

export { Tabs, TabsList, TabsTrigger, TabsContent };
