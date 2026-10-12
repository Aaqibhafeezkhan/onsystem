import * as React from "react"
import { cn } from "cn"

import { Badge } from "@/registry/new-york-v4/ui/badge"

export interface ReleaseBadgeItem {
  name: string
  status: "New" | "Updated" | "Deprecated" | string
}

export interface ReleaseBadgesProps extends React.HTMLAttributes<HTMLDivElement> {
  items?: ReleaseBadgeItem[]
}

const defaultItems: ReleaseBadgeItem[] = [
  { name: "Accordion", status: "Updated" },
  { name: "Alert", status: "New" },
  { name: "Avatar", status: "Updated" },
  { name: "Badge", status: "New" },
  { name: "Button", status: "Deprecated" },
  { name: "Card", status: "Updated" },
  { name: "Dialog", status: "New" },
  { name: "Dropdown Menu", status: "Updated" },
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
        "not-typeset grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3",
        className
      )}
      {...props}
    >
      {items.map((item, index) => {
        const status = item.status
        let badgeClassName = ""

        if (status === "New") {
          badgeClassName =
            "bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-300"
        } else if (status === "Updated") {
          badgeClassName =
            "bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300"
        } else if (status === "Deprecated") {
          badgeClassName =
            "bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300"
        }

        return (
          <div
            key={index}
            className="flex items-center justify-between rounded-lg border border-border bg-card p-3 text-card-foreground shadow-xs"
          >
            <span className="font-medium text-sm">{item.name}</span>
            <Badge className={cn("font-normal", badgeClassName)}>
              {status}
            </Badge>
          </div>
        )
      })}
    </div>
  )
}
