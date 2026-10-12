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
  keys: string | string[]
}

const DEFAULT_SHORTCUTS: ShortcutItem[] = [
  { action: "Search", keys: ["⌘", "K"] },
  { action: "Toggle theme", keys: ["⌘", "J"] },
  { action: "Copy code", keys: ["⌘", "C"] },
]

export interface ShortcutsTableProps
  extends React.ComponentProps<typeof Table> {
  shortcuts?: ShortcutItem[]
  data?: ShortcutItem[]
}

export function ShortcutsTable({
  shortcuts,
  data,
  className,
  ...props
}: ShortcutsTableProps) {
  const items = shortcuts ?? data ?? DEFAULT_SHORTCUTS

  return (
    <Table className={className} {...props}>
      <TableHeader>
        <TableRow>
          <TableHead>Action</TableHead>
          <TableHead>Keys</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {items.map((item) => {
          const keys = Array.isArray(item.keys) ? item.keys : [item.keys]

          return (
            <TableRow key={item.action}>
              <TableCell className="font-medium">{item.action}</TableCell>
              <TableCell>
                <KbdGroup>
                  {keys.map((key, index) => (
                    <Kbd key={index}>{key}</Kbd>
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

export default ShortcutsTable
