import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/registry/new-york-v4/ui/table"
import { Kbd } from "@/registry/new-york-v4/ui/kbd"

const shortcuts = [
  { action: "Search", keys: "⌘K" },
  { action: "Toggle theme", keys: "⌘J" },
  { action: "Copy code", keys: "⌘C" },
]

export function ShortcutsTable() {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead scope="col">Action</TableHead>
          <TableHead scope="col">Keys</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {shortcuts.map(({ action, keys }) => (
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
