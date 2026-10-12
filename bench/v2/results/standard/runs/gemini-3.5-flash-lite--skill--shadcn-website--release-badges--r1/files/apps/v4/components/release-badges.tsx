import * as React from "react"
import { cn } from "cn"

import { Badge } from "@/registry/new-york-v4/ui/badge"

export interface ReleaseBadgeItem {
  name: string
  status: "New" | "Updated" | "Deprecated"
}

export interface ReleaseBadgesProps extends React.ComponentProps<"div"> {
  items?: ReleaseBadgeItem[]
}

const defaultItems: ReleaseBadgeItem[] = [
  { name: "Accordion", status: "Updated" },
  { name: "Alert", status: "New" },
  { name: "Avatar", status: "Updated" },
  { name: "Button", status: "Updated" },
  { name: "Calendar", status: "New" },
  { name: "Collapsible", status: "Deprecated" },
  { name: "Combobox", status: "New" },
  { name: "Command", status: "Updated" },
  { name: "Context Menu", status: "Deprecated" },
]

export function ReleaseBadges({
  items = defaultItems,
  className,
  ...props
}: ReleaseBadgesProps) {
  return (
    <div
      className={cn("not-typeset w-full", className)}
      {...props}
    >
      <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3">
        {items.map((item, index) => {
          const badgeClass =
            item.status === "New"
              ? "bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-300"
              : item.status === "Updated"
              ? "bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300"
              : "bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300"

          return (
            <li
              key={index}
              className="flex items-center justify-between rounded-xl border border-border bg-card p-3.5 text-card-foreground shadow-xs"
            >
              <span className="font-medium text-sm">{item.name}</span>
              <Badge className={badgeClass}>{item.status}</Badge>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
