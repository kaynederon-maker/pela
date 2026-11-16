"use client";
import { CircleCheck, Info, Loader2, OctagonX, TriangleAlert } from "lucide-react";
import { Toaster as Sonner } from "sonner";

function Toaster(props) {
  return (
    <Sonner
      position="bottom-center"
      duration={4200}
      gap={10}
      icons={{
        success: <CircleCheck className="size-[18px] text-[#3e6b4f]" />,
        info: <Info className="size-[18px]" />,
        warning: <TriangleAlert className="size-[18px] text-[#8e5a2b]" />,
        error: <OctagonX className="size-[18px] text-destructive" />,
        loading: <Loader2 className="size-[18px] animate-spin text-primary" />,
      }}
      toastOptions={{
        classNames: {
          toast:
            "!rounded-[18px] !border !border-border !bg-card !px-4 !py-3.5 !font-sans !text-[15px] !text-foreground !shadow-[0_2px_0_0_rgb(31_20_11/0.08),0_18px_40px_-18px_rgb(31_20_11/0.4)]",
          description: "!text-muted-foreground",
        },
      }}
      {...props}
    />
  );
}

export { Toaster };
