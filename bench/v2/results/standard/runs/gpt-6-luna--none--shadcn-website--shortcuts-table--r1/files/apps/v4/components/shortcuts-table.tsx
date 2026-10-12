import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/registry/new-york-v4/ui/table"

const SHORTCUTS = [
  { action: "Search", keys: ["⌘", "K"] },
  { action: "Toggle theme", keys: ["⌘", "J"] },
  { action: "Copy code", keys: ["⌘", "C"] },
]

export function ShortcutsTable() {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Action</TableHead>
          <TableHead className="text-right">Keys</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {SHORTCUTS.map(({ action, keys }) => (
          <TableRow key={action}>
            <TableCell>{action}</TableCell>
            <TableCell>
              <div className="flex justify-end gap-1">
                {keys.map((key) => (
                  <kbd
                    key={key}
                    className="inline-flex h-5 min-w-5 items-center justify-center rounded border bg-muted px-1 font-mono text-xs font-medium text-muted-foreground"
                  >
                    {key}
                  </kbd>
                ))}
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}
