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
  { action: "Search", key: "K" },
  { action: "Toggle theme", key: "J" },
  { action: "Copy code", key: "C" },
] as const

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
                <Kbd aria-label="Command">⌘</Kbd>
                <Kbd>{shortcut.key}</Kbd>
              </KbdGroup>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}
