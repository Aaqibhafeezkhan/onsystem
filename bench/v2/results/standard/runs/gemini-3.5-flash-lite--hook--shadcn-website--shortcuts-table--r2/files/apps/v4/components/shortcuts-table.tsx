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

const shortcuts = [
  {
    action: "Search",
    keys: ["⌘", "K"],
  },
  {
    action: "Toggle theme",
    keys: ["⌘", "J"],
  },
  {
    action: "Copy code",
    keys: ["⌘", "C"],
  },
]

export function ShortcutsTable() {
  return (
    <Table aria-label="Keyboard shortcuts">
      <TableHeader>
        <TableRow>
          <TableHead>Action</TableHead>
          <TableHead>Keys</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {shortcuts.map((shortcut) => (
          <TableRow key={shortcut.action}>
            <TableCell className="font-medium">{shortcut.action}</TableCell>
            <TableCell>
              <KbdGroup>
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
