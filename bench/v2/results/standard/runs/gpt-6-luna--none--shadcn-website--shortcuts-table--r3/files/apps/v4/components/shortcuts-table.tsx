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
  { action: "Search", keys: ["⌘", "K"] },
  { action: "Toggle theme", keys: ["⌘", "J"] },
  { action: "Copy code", keys: ["⌘", "C"] },
]

export function ShortcutsTable() {
  return (
    <Table>
      <TableHeader>
        <TableRow className="hover:bg-transparent">
          <TableHead>Action</TableHead>
          <TableHead className="text-right">Keys</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {shortcuts.map(({ action, keys }) => (
          <TableRow key={action}>
            <TableCell>{action}</TableCell>
            <TableCell>
              <span className="flex justify-end gap-1">
                {keys.map((key) => (
                  <Kbd key={key}>{key}</Kbd>
                ))}
              </span>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}
