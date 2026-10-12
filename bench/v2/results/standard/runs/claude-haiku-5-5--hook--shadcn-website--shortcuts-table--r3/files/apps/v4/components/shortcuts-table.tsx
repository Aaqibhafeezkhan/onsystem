import { Kbd } from "@/registry/new-york-v4/ui/kbd"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/registry/new-york-v4/ui/table"

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
          <TableHead>Keys</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {shortcuts.map((shortcut) => (
          <TableRow key={shortcut.action}>
            <TableCell className="font-medium text-foreground">
              {shortcut.action}
            </TableCell>
            <TableCell>
              <span className="inline-flex items-center gap-1">
                {shortcut.keys.map((key) => (
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
