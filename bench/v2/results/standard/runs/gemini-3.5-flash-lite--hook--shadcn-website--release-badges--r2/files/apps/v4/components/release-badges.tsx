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
  { name: "Button", status: "Updated" },
  { name: "Dialog", status: "New" },
  { name: "DropdownMenu", status: "Updated" },
  { name: "Tooltip", status: "Deprecated" },
  { name: "Avatar", status: "New" },
  { name: "Alert", status: "Updated" },
  { name: "Command", status: "New" },
  { name: "Popover", status: "Deprecated" },
]

export function ReleaseBadges({
  items = defaultItems,
  className,
  ...props
}: ReleaseBadgesProps) {
  return (
    <div
      className={cn(
        "flex flex-col divide-y divide-border overflow-hidden rounded-lg border border-border bg-card text-card-foreground shadow-xs",
        className
      )}
      {...props}
    >
      {items.map((item, index) => {
        const badgeClassName =
          item.status === "New"
            ? "bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-300"
            : item.status === "Updated"
            ? "bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300"
            : "bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300"

        return (
          <div
            key={`${item.name}-${index}`}
            className="flex items-center justify-between px-4 py-3"
          >
            <span className="font-medium text-foreground">{item.name}</span>
            <Badge variant="secondary" className={badgeClassName}>
              {item.status}
            </Badge>
          </div>
        )
      })}
    </div>
  )
}
