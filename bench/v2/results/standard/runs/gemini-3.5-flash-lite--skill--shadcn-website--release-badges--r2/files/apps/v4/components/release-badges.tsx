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
  { name: "Button", status: "New" },
  { name: "Dialog", status: "Updated" },
  { name: "DropdownMenu", status: "Deprecated" },
  { name: "Tooltip", status: "New" },
  { name: "Select", status: "Updated" },
]

export function ReleaseBadges({
  items = defaultItems,
  className,
  ...props
}: ReleaseBadgesProps) {
  return (
    <div
      className={cn("not-typeset flex flex-col gap-3", className)}
      {...props}
    >
      {items.map((item, index) => {
        let badgeClassName = ""
        if (item.status === "New") {
          badgeClassName =
            "bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-300"
        } else if (item.status === "Updated") {
          badgeClassName =
            "bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300"
        } else if (item.status === "Deprecated") {
          badgeClassName =
            "bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300"
        }

        return (
          <div
            key={`${item.name}-${index}`}
            className="flex items-center justify-between gap-4 rounded-lg border border-border p-3 text-sm"
          >
            <span className="font-medium text-foreground">{item.name}</span>
            <Badge className={badgeClassName}>{item.status}</Badge>
          </div>
        )
      })}
    </div>
  )
}
