import * as React from "react";
import * as TooltipPrimitive from "@radix-ui/react-tooltip";
import { cn } from "@/lib/utils";

export const TooltipProvider = TooltipPrimitive.Provider;

export const Tooltip = React.forwardRef<
    React.ElementRef<typeof TooltipPrimitive.Root>,
    React.ComponentPropsWithoutRef<typeof TooltipPrimitive.Root>
>(({ delayDuration = 100, ...props }, ref) => (
    <TooltipPrimitive.Root ref={ref} delayDuration={delayDuration} {...props} />
));
Tooltip.displayName = TooltipPrimitive.Root.displayName;

export const TooltipTrigger = TooltipPrimitive.Trigger;

export const TooltipContent = React.forwardRef<
    React.ElementRef<typeof TooltipPrimitive.Content>,
    React.ComponentPropsWithoutRef<typeof TooltipPrimitive.Content>
>(({ className, sideOffset = 8, side = "top", align = "center", ...props }, ref) => (
    <TooltipPrimitive.Portal>
        <TooltipPrimitive.Content
            ref={ref}
            sideOffset={sideOffset}
            side={side}
            align={align}
            // avoidCollisions ayuda cuando hay bordes/scroll
            collisionPadding={8}
            className={cn(
                // z-index MUY alto + position fixed (Radix ya usa fixed)
                "z-[999999] overflow-hidden rounded-md border bg-slate-900 text-white border-slate-700 shadow-xl px-3 py-1.5 text-sm " +
                "animate-in fade-in-0 zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 " +
                "data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 " +
                "data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2",
                className
            )}
            {...props}
        />
    </TooltipPrimitive.Portal>
));
TooltipContent.displayName = TooltipPrimitive.Content.displayName;