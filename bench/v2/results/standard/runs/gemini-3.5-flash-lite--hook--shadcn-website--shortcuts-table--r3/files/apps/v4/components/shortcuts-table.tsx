import { cn } from "cn"

import { Kbd, KbdGroup } from "@/registry/new-york-v4/ui/kbd"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/registry/new-york-v4/ui/table"

const SHORTCUTS = [
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

export function ShortcutsTable({
  className,
  ...props
}: React.ComponentProps<typeof Table>) {
  return (
    <Table className={cn("w-full", className)} {...props}>
      <TableHeader>
        <TableRow>
          <TableHead>Action</TableHead>
          <TableHead className="text-right">Keys</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {SHORTCUTS.map((shortcut) => (
          <TableRow key={shortcut.action}>
            <TableCell className="font-medium">{shortcut.action}</TableCell>
            <TableCell className="text-right">
              <KbdGroup className="justify-end">
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
