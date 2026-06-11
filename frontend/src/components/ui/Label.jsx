import { cn } from "../../lib/utils";

export const Label = ({ className, ...props }) => {
  return (
    <label
      className={cn("block text-sm font-medium text-slate-700 dark:text-slate-300", className)}
      {...props}
    />
  );
};

export default Label;
