import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/registry/new-york-v4/ui/table"
import { Kbd } from "@/registry/new-york-v4/ui/kbd"

const SHORTCUTS = [
  { action: "Search", keys: "⌘K" },
  { action: "Toggle theme", keys: "⌘J" },
  { action: "Copy code", keys: "⌘C" },
]

export function ShortcutsTable() {
  return (
    <Table>
      <TableHeader>
        <TableRow className="hover:bg-transparent">
          <TableHead>Action</TableHead>
          <TableHead>Keys</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {SHORTCUTS.map((shortcut) => (
          <TableRow key={shortcut.action}>
            <TableCell>{shortcut.action}</TableCell>
            <TableCell>
              <Kbd>{shortcut.keys}</Kbd>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}
