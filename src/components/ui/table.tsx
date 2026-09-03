import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function TableWrap({ className, tableClassName, children }: { className?: string; tableClassName?: string; children: ReactNode }) {
  return (
    <div className={cn("overflow-x-auto rounded-none border border-line bg-surface", className)}>
      <table className={cn("w-full min-w-[640px] text-left text-sm", tableClassName)}>{children}</table>
    </div>
  );
}

export function THead({ children }: { children: ReactNode }) {
  return (
    <thead className="border-b border-line bg-surface-alt">
      <tr>{children}</tr>
    </thead>
  );
}

export function Th({ className, children }: { className?: string; children?: ReactNode }) {
  return (
    <th
      scope="col"
      className={cn(
        "px-4 py-3 align-middle text-xs font-semibold tracking-wide text-muted uppercase whitespace-nowrap",
        className
      )}
    >
      {children}
    </th>
  );
}

export function Tr({
  className,
  onClick,
  children,
}: {
  className?: string;
  onClick?: () => void;
  children: ReactNode;
}) {
  return (
    <tr
      onClick={onClick}
      className={cn(
        "border-b border-line transition-colors last:border-0 hover:bg-white/[0.03]",
        onClick && "cursor-pointer",
        className
      )}
    >
      {children}
    </tr>
  );
}

export function Td({ className, children }: { className?: string; children: ReactNode }) {
  return <td className={cn("px-4 py-3.5 text-left align-middle", className)}>{children}</td>;
}

export function TableEmpty({ colSpan, children }: { colSpan: number; children: ReactNode }) {
  return (
    <tr>
      <td colSpan={colSpan} className="px-4 py-10 text-center text-sm text-muted">
        {children}
      </td>
    </tr>
  );
}
