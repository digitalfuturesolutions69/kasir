import { ButtonHTMLAttributes, forwardRef } from "react";
import clsx from "clsx";

type Variant = "primary" | "secondary" | "ghost" | "danger";
type Size = "sm" | "md" | "lg";

const variantClasses: Record<Variant, string> = {
  primary:
    "bg-indigo-600 text-white hover:bg-indigo-500 shadow-sm shadow-indigo-600/20 disabled:bg-indigo-300",
  secondary:
    "bg-white text-slate-700 border border-slate-200 hover:bg-slate-50 disabled:text-slate-400",
  ghost: "bg-transparent text-slate-600 hover:bg-slate-100 disabled:text-slate-300",
  danger:
    "bg-red-50 text-red-600 hover:bg-red-100 border border-red-100 disabled:text-red-300",
};

const sizeClasses: Record<Size, string> = {
  sm: "px-3 py-1.5 text-sm rounded-lg gap-1.5",
  md: "px-4 py-2.5 text-sm rounded-xl gap-2",
  lg: "px-6 py-3 text-base rounded-xl gap-2",
};

export const Button = forwardRef<
  HTMLButtonElement,
  ButtonHTMLAttributes<HTMLButtonElement> & {
    variant?: Variant;
    size?: Size;
    fullWidth?: boolean;
  }
>(function Button(
  { className, variant = "primary", size = "md", fullWidth, ...props },
  ref
) {
  return (
    <button
      ref={ref}
      className={clsx(
        "inline-flex items-center justify-center font-medium transition-colors duration-150 disabled:cursor-not-allowed cursor-pointer",
        variantClasses[variant],
        sizeClasses[size],
        fullWidth && "w-full",
        className
      )}
      {...props}
    />
  );
});
