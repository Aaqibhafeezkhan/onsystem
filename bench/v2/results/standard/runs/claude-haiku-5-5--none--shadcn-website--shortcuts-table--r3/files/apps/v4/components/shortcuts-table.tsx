import { cn } from "cn"

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/registry/new-york-v4/ui/table"

const shortcuts: { action: string; keys: string[] }[] = [
  { action: "Search", keys: ["⌘", "K"] },
  { action: "Toggle theme", keys: ["⌘", "J"] },
  { action: "Copy code", keys: ["⌘", "C"] },
]

function ShortcutKey({
  className,
  ...props
}: React.ComponentProps<"kbd">) {
  return (
    <kbd
      data-slot="shortcut-key"
      className={cn(
        "pointer-events-none flex h-5 min-w-5 items-center justify-center rounded border bg-background px-1 font-sans text-[0.7rem] font-medium text-muted-foreground select-none",
        className
      )}
      {...props}
    />
  )
}

export function ShortcutsTable({ className }: { className?: string }) {
  return (
    <Table className={className}>
      <TableHeader>
        <TableRow className="hover:bg-transparent">
          <TableHead>Action</TableHead>
          <TableHead>Keys</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {shortcuts.map((shortcut) => (
          <TableRow key={shortcut.action}>
            <TableCell className="font-medium text-foreground">
              {shortcut.action}
            </TableCell>
            <TableCell>
              <span className="flex items-center gap-1">
                {shortcut.keys.map((key) => (
                  <ShortcutKey key={key}>{key}</ShortcutKey>
                ))}
              </span>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}
