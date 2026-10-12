import { Kbd, KbdGroup } from "@/registry/new-york-v4/ui/kbd"
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
    <Table aria-label="Keyboard shortcuts">
      <TableHeader>
        <TableRow>
          <TableHead scope="col">Action</TableHead>
          <TableHead scope="col">Keys</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {shortcuts.map((shortcut) => (
          <TableRow key={shortcut.action}>
            <TableCell>{shortcut.action}</TableCell>
            <TableCell>
              <KbdGroup>
                {shortcut.keys.map((key) => (
                  <Kbd key={key}>{key}</Kbd>
                ))}
              </KbdGroup>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}
