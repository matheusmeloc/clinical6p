import * as React from "react";
import { cn } from "../../lib/utils";

const Sheet = React.forwardRef(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("fixed inset-0 z-50 flex", className)}
    {...props}
  />
));
Sheet.displayName = "Sheet";

const SheetContent = React.forwardRef(
  ({ className, side = "left", ...props }, ref) => {
    const sideClasses =
      side === "left" ? "left-0 origin-left" : "right-0 origin-right";

    return (
      <div
        ref={ref}
        className={cn(
          "fixed inset-y-0 z-50 flex w-[280px] flex-col border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-xl transition-transform duration-300 ease-in-out",
          sideClasses,
          className,
        )}
        {...props}
      />
    );
  },
);
SheetContent.displayName = "SheetContent";

const SheetHeader = React.forwardRef(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("mb-4 flex flex-col gap-2", className)}
    {...props}
  />
));
SheetHeader.displayName = "SheetHeader";

const SheetTitle = React.forwardRef(({ className, ...props }, ref) => (
  <h2
    ref={ref}
    className={cn("text-lg font-semibold text-slate-900 dark:text-slate-100", className)}
    {...props}
  />
));
SheetTitle.displayName = "SheetTitle";

const SheetDescription = React.forwardRef(({ className, ...props }, ref) => (
  <p ref={ref} className={cn("text-sm text-slate-500 dark:text-slate-400", className)} {...props} />
));
SheetDescription.displayName = "SheetDescription";

const SheetFooter = React.forwardRef(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("mt-auto", className)} {...props} />
));
SheetFooter.displayName = "SheetFooter";

export {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
};
