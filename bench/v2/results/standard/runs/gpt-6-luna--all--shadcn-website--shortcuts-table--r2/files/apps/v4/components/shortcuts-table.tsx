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
  { action: "Search", key: "K" },
  { action: "Toggle theme", key: "J" },
  { action: "Copy code", key: "C" },
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
        {shortcuts.map(({ action, key }) => (
          <TableRow key={action}>
            <TableCell>{action}</TableCell>
            <TableCell>
              <KbdGroup aria-label={`Command plus ${key}`}>
                <Kbd>⌘</Kbd>
                <Kbd>{key}</Kbd>
              </KbdGroup>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}
