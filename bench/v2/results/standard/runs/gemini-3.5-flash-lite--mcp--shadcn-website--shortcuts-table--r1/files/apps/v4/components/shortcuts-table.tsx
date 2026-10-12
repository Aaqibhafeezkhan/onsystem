import * as React from "react"
import { cn } from "cn"

import { Kbd, KbdGroup } from "@/registry/new-york-v4/ui/kbd"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/registry/new-york-v4/ui/table"

export interface ShortcutsTableProps extends React.ComponentProps<"div"> {
  shortcuts?: Array<{
    action: string
    keys: string[]
  }>
}

const defaultShortcuts = [
  { action: "Search", keys: ["⌘", "K"] },
  { action: "Toggle theme", keys: ["⌘", "J"] },
  { action: "Copy code", keys: ["⌘", "C"] },
]

export function ShortcutsTable({
  shortcuts = defaultShortcuts,
  className,
  ...props
}: ShortcutsTableProps) {
  return (
    <div
      className={cn(
        "rounded-lg border bg-card text-card-foreground shadow-xs",
        className
      )}
      {...props}
    >
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Action</TableHead>
            <TableHead className="text-right">Keys</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {shortcuts.map((shortcut) => (
            <TableRow key={shortcut.action}>
              <TableCell className="font-medium">{shortcut.action}</TableCell>
              <TableCell className="text-right">
                <KbdGroup className="justify-end">
                  {shortcut.keys.map((key, index) => (
                    <Kbd key={index}>{key}</Kbd>
                  ))}
                </KbdGroup>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
