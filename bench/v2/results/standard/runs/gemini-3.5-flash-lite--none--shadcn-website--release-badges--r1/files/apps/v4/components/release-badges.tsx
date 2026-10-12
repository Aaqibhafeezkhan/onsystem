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
  { name: "Accordion", status: "Deprecated" },
  { name: "Avatar", status: "New" },
  { name: "Calendar", status: "Updated" },
  { name: "Card", status: "Deprecated" },
  { name: "Tooltip", status: "New" },
]

export function ReleaseBadges({
  items = defaultItems,
  className,
  ...props
}: ReleaseBadgesProps) {
  return (
    <div
      className={cn(
        "not-typeset grid gap-3 sm:grid-cols-2 md:grid-cols-3",
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
            key={index}
            className="flex items-center justify-between rounded-lg border border-border bg-card p-3 text-card-foreground shadow-sm"
          >
            <span className="font-medium">{item.name}</span>
            <Badge className={badgeClassName}>{item.status}</Badge>
          </div>
        )
      })}
    </div>
  )
}
