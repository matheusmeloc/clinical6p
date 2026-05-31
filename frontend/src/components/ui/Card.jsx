import { cn } from "../../lib/utils";

export const Card = ({ children, className = "" }) => {
  return (
    <div
      className={cn(
        "rounded-3xl border border-slate-200 bg-white shadow-sm shadow-slate-200/40 p-6",
        className,
      )}
    >
      {children}
    </div>
  );
};

export default Card;
