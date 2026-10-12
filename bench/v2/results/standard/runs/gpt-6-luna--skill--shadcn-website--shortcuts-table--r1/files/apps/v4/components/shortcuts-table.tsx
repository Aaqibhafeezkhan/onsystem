import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/styles/base-nova/ui/table"
import { Kbd } from "@/styles/base-nova/ui/kbd"

const SHORTCUTS = [
  { action: "Search", keys: "⌘K" },
  { action: "Toggle theme", keys: "⌘J" },
  { action: "Copy code", keys: "⌘C" },
]

export function ShortcutsTable() {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Action</TableHead>
          <TableHead>Keys</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {SHORTCUTS.map(({ action, keys }) => (
          <TableRow key={action}>
            <TableCell>{action}</TableCell>
            <TableCell>
              <Kbd>{keys}</Kbd>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}
