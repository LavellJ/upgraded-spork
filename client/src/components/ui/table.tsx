import * as React from "react"
import { PropsWithChildren, ReactNode } from 'react'
import { ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react"
import { cn } from "../../lib/utils"
import clsx from 'clsx'

export function Table({ children, className }:{ children: ReactNode; className?: string }) {
  return (
    <div className={clsx('overflow-auto rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--bg-card))]', className)}>
      <table className="w-full text-sm">
        {children}
      </table>
    </div>
  )
}

export function THead({ children }:{ children: ReactNode }) {
  return (
    <thead className="sticky top-0 bg-[rgb(var(--bg-soft))] text-[rgb(var(--fg-muted))]">
      {children}
    </thead>
  )
}

export function TBody({ children }:{ children: ReactNode }) {
  return <tbody>{children}</tbody>
}

export function TR({ children, className }:{ children: ReactNode; className?: string }) {
  return <tr className={clsx('border-b border-[rgb(var(--border))]', className)}>{children}</tr>
}

export function TH({ children, className, onClick, ...props }:{ children: ReactNode; className?: string; onClick?: () => void; } & React.ThHTMLAttributes<HTMLTableHeaderCellElement>) {
  return <th scope="col" className={clsx('text-left font-medium px-3 py-[calc(12px*var(--density))]', className)} onClick={onClick} {...props}>{children}</th>
}

export function TD({ children, className }:{ children: ReactNode; className?: string }) {
  return <td className={clsx('px-3 py-[calc(12px*var(--density))] align-middle', className)}>{children}</td>
}

// Legacy components for compatibility
const TableLegacy = React.forwardRef<
  HTMLTableElement,
  React.HTMLAttributes<HTMLTableElement>
>(({ className, ...props }, ref) => (
  <div className="relative w-full overflow-auto">
    <table
      ref={ref}
      className={cn(
        "w-full caption-bottom text-sm text-fg-default", // Use design tokens
        "data-[density='compact']:text-xs",
        className
      )}
      {...props}
    />
  </div>
))
TableLegacy.displayName = "TableLegacy"

const TableHeader = React.forwardRef<
  HTMLTableSectionElement,
  React.HTMLAttributes<HTMLTableSectionElement> & {
    sticky?: boolean;
  }
>(({ className, sticky = false, ...props }, ref) => (
  <thead 
    ref={ref} 
    className={cn(
      "[&_tr]:border-b [&_tr]:border-border",
      sticky && "sticky top-0 z-10 bg-bg-card",
      className
    )} 
    {...props} 
  />
))
TableHeader.displayName = "TableHeader"

const TableBody = React.forwardRef<
  HTMLTableSectionElement,
  React.HTMLAttributes<HTMLTableSectionElement>
>(({ className, ...props }, ref) => (
  <tbody
    ref={ref}
    className={cn("[&_tr:last-child]:border-0", className)}
    {...props}
  />
))
TableBody.displayName = "TableBody"

const TableFooter = React.forwardRef<
  HTMLTableSectionElement,
  React.HTMLAttributes<HTMLTableSectionElement>
>(({ className, ...props }, ref) => (
  <tfoot
    ref={ref}
    className={cn(
      "border-t bg-muted/50 font-medium [&>tr]:last:border-b-0",
      className
    )}
    {...props}
  />
))
TableFooter.displayName = "TableFooter"

const TableRow = React.forwardRef<
  HTMLTableRowElement,
  React.HTMLAttributes<HTMLTableRowElement>
>(({ className, ...props }, ref) => (
  <tr
    ref={ref}
    className={cn(
      "border-b border-border transition-colors hover:bg-bg-subtle data-[state=selected]:bg-bg-subtle",
      "data-[density='compact']:h-8", // Compact row height
      className
    )}
    {...props}
  />
))
TableRow.displayName = "TableRow"

interface TableHeadProps extends React.ThHTMLAttributes<HTMLTableCellElement> {
  sortable?: boolean;
  sortDirection?: 'asc' | 'desc' | 'none';
  onSort?: () => void;
}

const TableHead = React.forwardRef<
  HTMLTableCellElement,
  TableHeadProps
>(({ className, sortable, sortDirection = 'none', onSort, children, ...props }, ref) => {
  const SortIcon = sortDirection === 'asc' ? ArrowUp : sortDirection === 'desc' ? ArrowDown : ArrowUpDown;
  
  const content = (
    <>
      {children}
      {sortable && (
        <SortIcon className="ml-2 h-4 w-4 inline-block opacity-50" />
      )}
    </>
  );
  
  return (
    <th
      ref={ref}
      className={cn(
        "h-12 px-4 text-left align-middle font-medium text-fg-muted [&:has([role=checkbox])]:pr-0",
        "data-[density='compact']:h-8 data-[density='compact']:px-3",
        sortable && "cursor-pointer hover:text-fg-default transition-colors select-none",
        className
      )}
      onClick={sortable ? onSort : undefined}
      {...props}
    >
      {sortable ? (
        <div className="flex items-center">
          {content}
        </div>
      ) : (
        content
      )}
    </th>
  );
})
TableHead.displayName = "TableHead"

const TableCell = React.forwardRef<
  HTMLTableCellElement,
  React.TdHTMLAttributes<HTMLTableCellElement>
>(({ className, ...props }, ref) => (
  <td
    ref={ref}
    className={cn(
      "p-4 align-middle [&:has([role=checkbox])]:pr-0",
      "data-[density='compact']:p-3",
      className
    )}
    {...props}
  />
))
TableCell.displayName = "TableCell"

const TableCaption = React.forwardRef<
  HTMLTableCaptionElement,
  React.HTMLAttributes<HTMLTableCaptionElement>
>(({ className, ...props }, ref) => (
  <caption
    ref={ref}
    className={cn("mt-4 text-sm text-fg-muted", className)} // Use design tokens
    {...props}
  />
))
TableCaption.displayName = "TableCaption"

export {
  TableLegacy as TableOld,
  TableHeader,
  TableBody,
  TableFooter,
  TableHead,
  TableRow,
  TableCell,
  TableCaption,
}
