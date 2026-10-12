import * as React from "react"
import { cn } from "cn"

import { Badge } from "@/registry/new-york-v4/ui/badge"

export interface ReleaseItem {
  name: string
  status: "New" | "Updated" | "Deprecated"
}

export interface ReleaseBadgesProps extends React.ComponentProps<"div"> {
  items?: ReleaseItem[]
}

const defaultItems: ReleaseItem[] = [
  { name: "Button", status: "Updated" },
  { name: "Command", status: "New" },
  { name: "Dialog", status: "Updated" },
  { name: "Field", status: "New" },
  { name: "Select", status: "Deprecated" },
  { name: "InputGroup", status: "New" },
]

export function ReleaseBadges({
  items = defaultItems,
  className,
  ...props
}: ReleaseBadgesProps) {
  return (
    <div className={cn("not-typeset w-full", className)} {...props}>
      <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3">
        {items.map((item, index) => (
          <li
            key={index}
            className="flex items-center justify-between rounded-lg border border-border bg-card p-3 text-card-foreground shadow-none"
          >
            <span className="font-medium">{item.name}</span>
            <Badge
              className={cn(
                item.status === "New" &&
                  "bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-300",
                item.status === "Updated" &&
                  "bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300",
                item.status === "Deprecated" &&
                  "bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300"
              )}
            >
              {item.status}
            </Badge>
          </li>
        ))}
      </ul>
    </div>
  )
}
