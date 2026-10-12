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

export type ShortcutItem = {
  action: string
  keys: string[]
}

export function ShortcutsTable({
  shortcuts = [
    { action: "Search", keys: ["⌘", "K"] },
    { action: "Toggle theme", keys: ["⌘", "J"] },
    { action: "Copy code", keys: ["⌘", "C"] },
  ],
  className,
  ...props
}: React.ComponentProps<typeof Table> & {
  shortcuts?: ShortcutItem[]
}) {
  return (
    <Table className={className} {...props}>
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
  )
}
