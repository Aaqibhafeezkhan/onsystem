import * as React from "react"
import { cn } from "cn"

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/registry/new-york-v4/ui/table"
import { Kbd, KbdGroup } from "@/registry/new-york-v4/ui/kbd"

export interface ShortcutsTableProps extends React.ComponentProps<typeof Table> {
  shortcuts?: {
    action: string
    keys: string[] | string
  }[]
}

const DEFAULT_SHORTCUTS = [
  { action: "Search", keys: ["⌘", "K"] },
  { action: "Toggle theme", keys: ["⌘", "J"] },
  { action: "Copy code", keys: ["⌘", "C"] },
]

export function ShortcutsTable({
  shortcuts = DEFAULT_SHORTCUTS,
  className,
  ...props
}: ShortcutsTableProps) {
  return (
    <Table className={className} {...props}>
      <TableHeader>
        <TableRow className="hover:bg-transparent">
          <TableHead>Action</TableHead>
          <TableHead className="text-right">Keys</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {shortcuts.map((shortcut, index) => (
          <TableRow key={index}>
            <TableCell className="font-medium text-foreground">
              {shortcut.action}
            </TableCell>
            <TableCell className="text-right">
              {Array.isArray(shortcut.keys) ? (
                <KbdGroup>
                  {shortcut.keys.map((key, keyIndex) => (
                    <Kbd key={keyIndex}>{key}</Kbd>
                  ))}
                </KbdGroup>
              ) : (
                <Kbd>{shortcut.keys}</Kbd>
              )}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}
