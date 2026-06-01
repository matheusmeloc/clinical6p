import * as React from "react";
import { X } from "lucide-react";
import { cn } from "../../lib/utils";

const Dialog = ({ open, onOpenChange, children }) => {
  React.useEffect(() => {
    const handleKey = (e) => {
      if (e.key === "Escape") onOpenChange?.(false);
    };
    if (open) document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [open, onOpenChange]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={() => onOpenChange?.(false)}
      />
      {children}
    </div>
  );
};

const DialogContent = React.forwardRef(({ className, children, onClose, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "relative z-50 w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-lg bg-white shadow-2xl border border-slate-200 p-6",
      className,
    )}
    onClick={(e) => e.stopPropagation()}
    {...props}
  >
    {onClose && (
      <button
        onClick={onClose}
        className="absolute right-4 top-4 rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors"
      >
        <X className="h-4 w-4" />
      </button>
    )}
    {children}
  </div>
));
DialogContent.displayName = "DialogContent";

const DialogHeader = ({ className, ...props }) => (
  <div className={cn("mb-6", className)} {...props} />
);

const DialogTitle = React.forwardRef(({ className, ...props }, ref) => (
  <h2
    ref={ref}
    className={cn("text-xl font-bold text-slate-900 pr-8", className)}
    {...props}
  />
));
DialogTitle.displayName = "DialogTitle";

const DialogDescription = React.forwardRef(({ className, ...props }, ref) => (
  <p ref={ref} className={cn("mt-1 text-sm text-slate-500", className)} {...props} />
));
DialogDescription.displayName = "DialogDescription";

const DialogFooter = ({ className, ...props }) => (
  <div
    className={cn("mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end", className)}
    {...props}
  />
);

export { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter };

