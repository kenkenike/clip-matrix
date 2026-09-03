"use client";

import { useId, type InputHTMLAttributes, type ReactNode, type SelectHTMLAttributes, type TextareaHTMLAttributes } from "react";
import { AlertCircle, ChevronDown, Search } from "lucide-react";
import { cn } from "@/lib/utils";

const baseField =
  "w-full rounded-xl border border-line bg-surface-alt px-3.5 text-sm text-fg placeholder:text-faint transition-colors focus:border-accent/60 focus:outline-none";

export function Label({
  htmlFor,
  children,
  hint,
}: {
  htmlFor?: string;
  children: ReactNode;
  hint?: string;
}) {
  return (
    <label htmlFor={htmlFor} className="mb-1.5 flex items-center justify-between text-xs font-medium text-muted">
      <span>{children}</span>
      {hint && <span className="text-faint">{hint}</span>}
    </label>
  );
}

export function FieldError({ message }: { message?: string | null }) {
  if (!message) return null;
  return (
    <p className="mt-1.5 flex items-center gap-1 text-xs text-red-400">
      <AlertCircle className="h-3 w-3" aria-hidden="true" />
      {message}
    </p>
  );
}

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  error?: string | null;
}

export function Input({ className, error, ...props }: InputProps) {
  return (
    <input
      aria-invalid={error ? true : undefined}
      className={cn(baseField, "h-10", error && "border-red-500/60", className)}
      {...props}
    />
  );
}

export function Textarea({
  className,
  error,
  ...props
}: TextareaHTMLAttributes<HTMLTextAreaElement> & { error?: string | null }) {
  return (
    <textarea
      aria-invalid={error ? true : undefined}
      className={cn(baseField, "min-h-24 py-2.5 leading-relaxed", error && "border-red-500/60", className)}
      {...props}
    />
  );
}

export interface SelectOption {
  value: string;
  label: string;
}

export function Select({
  options,
  className,
  ariaLabel,
  ...props
}: SelectHTMLAttributes<HTMLSelectElement> & { options: SelectOption[]; ariaLabel: string }) {
  return (
    <div className={cn("relative", className)}>
      <select
        aria-label={ariaLabel}
        className={cn(
          baseField,
          "h-10 cursor-pointer appearance-none pr-9",
          props.disabled && "cursor-not-allowed opacity-50"
        )}
        {...props}
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value} className="bg-elevated text-fg">
            {opt.label}
          </option>
        ))}
      </select>
      <ChevronDown
        aria-hidden="true"
        className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted"
      />
    </div>
  );
}

export function SearchBar({
  value,
  onChange,
  placeholder = "Search...",
  className,
  ariaLabel = "Search",
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  ariaLabel?: string;
}) {
  const id = useId();
  return (
    <div className={cn("relative", className)}>
      <Search
        aria-hidden="true"
        className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-faint"
      />
      <input
        id={id}
        type="search"
        aria-label={ariaLabel}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={cn(baseField, "h-10 pl-10 [&::-webkit-search-cancel-button]:hidden")}
      />
    </div>
  );
}
