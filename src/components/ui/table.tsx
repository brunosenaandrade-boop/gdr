import { cn } from "@/lib/utils";
import { type HTMLAttributes, type TdHTMLAttributes, type ThHTMLAttributes } from "react";

function Table({ className, children, ...props }: HTMLAttributes<HTMLTableElement>) {
  return (
    <div className="w-full overflow-auto">
      <table className={cn("w-full caption-bottom text-sm", className)} {...props}>
        {children}
      </table>
    </div>
  );
}

function TableHeader({ className, children, ...props }: HTMLAttributes<HTMLTableSectionElement>) {
  return (
    <thead className={cn("border-b border-white/5", className)} {...props}>
      {children}
    </thead>
  );
}

function TableBody({ className, children, ...props }: HTMLAttributes<HTMLTableSectionElement>) {
  return (
    <tbody className={cn("[&_tr:last-child]:border-0", className)} {...props}>
      {children}
    </tbody>
  );
}

function TableRow({ className, children, ...props }: HTMLAttributes<HTMLTableRowElement>) {
  return (
    <tr
      className={cn(
        "border-b border-white/5 transition-colors hover:bg-white/[0.02]",
        className,
      )}
      {...props}
    >
      {children}
    </tr>
  );
}

function TableHead({ className, children, ...props }: ThHTMLAttributes<HTMLTableCellElement>) {
  return (
    <th
      className={cn(
        "h-10 px-4 text-left align-middle text-xs font-medium uppercase tracking-wider text-slate-500",
        className,
      )}
      {...props}
    >
      {children}
    </th>
  );
}

function TableCell({ className, children, ...props }: TdHTMLAttributes<HTMLTableCellElement>) {
  return (
    <td className={cn("px-4 py-3 align-middle text-sm text-slate-300", className)} {...props}>
      {children}
    </td>
  );
}

export { Table, TableHeader, TableBody, TableRow, TableHead, TableCell };
