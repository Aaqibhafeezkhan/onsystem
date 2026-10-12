import * as React from "react"

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/registry/new-york-v4/ui/table"
import { Kbd, KbdGroup } from "@/registry/new-york-v4/ui/kbd"

export interface ShortcutItem {
  action: string
  keys: string[] | string
}

const defaultShortcuts: ShortcutItem[] = [
  { action: "Search", keys: ["⌘", "K"] },
  { action: "Toggle theme", keys: ["⌘", "J"] },
  { action: "Copy code", keys: ["⌘", "C"] },
]

export interface ShortcutsTableProps
  extends React.ComponentProps<typeof Table> {
  shortcuts?: ShortcutItem[]
}

export function ShortcutsTable({
  shortcuts = defaultShortcuts,
  className,
  ...props
}: ShortcutsTableProps) {
  return (
    <Table className={className} {...props}>
      <TableHeader>
        <TableRow>
          <TableHead>Action</TableHead>
          <TableHead className="text-right">Keys</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {shortcuts.map((shortcut) => {
          const keys = Array.isArray(shortcut.keys)
            ? shortcut.keys
            : [shortcut.keys]

          return (
            <TableRow key={shortcut.action}>
              <TableCell className="font-medium">{shortcut.action}</TableCell>
              <TableCell className="text-right">
                <KbdGroup className="justify-end">
                  {keys.map((key, index) => (
                    <Kbd key={`${key}-${index}`}>{key}</Kbd>
                  ))}
                </KbdGroup>
              </TableCell>
            </TableRow>
          )
        })}
      </TableBody>
    </Table>
  )
}
