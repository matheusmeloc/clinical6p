import { cn } from "../../lib/utils";

export const Card = ({ children, className = "" }) => {
  return (
    <div
      className={cn(
        "rounded-lg sm:rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-sm shadow-slate-200/40 dark:shadow-slate-900/40 p-4 sm:p-6",
        className,
      )}
    >
      {children}
    </div>
  );
};

export default Card;

