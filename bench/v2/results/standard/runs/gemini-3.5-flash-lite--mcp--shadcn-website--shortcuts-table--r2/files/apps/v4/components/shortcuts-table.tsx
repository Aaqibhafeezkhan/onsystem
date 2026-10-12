import * as React from "react"
import { cn } from "cn"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/registry/new-york-v4/ui/table"
import { Kbd, KbdGroup } from "@/registry/new-york-v4/ui/kbd"

export interface ShortcutItem {
  action: string
  keys: string[]
}

const defaultShortcuts: ShortcutItem[] = [
  { action: "Search", keys: ["⌘", "K"] },
  { action: "Toggle theme", keys: ["⌘", "J"] },
  { action: "Copy code", keys: ["⌘", "C"] },
]

export interface ShortcutsTableProps extends React.ComponentProps<"div"> {
  shortcuts?: ShortcutItem[]
}

export function ShortcutsTable({
  shortcuts = defaultShortcuts,
  className,
  ...props
}: ShortcutsTableProps) {
  return (
    <div className={cn("w-full", className)} {...props}>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Action</TableHead>
            <TableHead className="text-right">Keys</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {shortcuts.map((shortcut, index) => (
            <TableRow key={index}>
              <TableCell className="font-medium">
                {shortcut.action}
              </TableCell>
              <TableCell className="text-right">
                <KbdGroup className="justify-end">
                  {shortcut.keys.map((key, keyIndex) => (
                    <Kbd key={keyIndex}>{key}</Kbd>
                  ))}
                </KbdGroup>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
