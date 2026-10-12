import * as React from "react"
import { cn } from "cn"

import { Badge } from "@/registry/new-york-v4/ui/badge"

export interface ReleaseBadgeItem {
  name: string
  status: "New" | "Updated" | "Deprecated" | string
}

export interface ReleaseBadgesProps extends React.ComponentProps<"div"> {
  items?: ReleaseBadgeItem[]
}

const defaultItems: ReleaseBadgeItem[] = [
  { name: "Accordion", status: "New" },
  { name: "Collapsible", status: "Updated" },
  { name: "ContextMenu", status: "Deprecated" },
  { name: "HoverCard", status: "New" },
  { name: "AspectRatio", status: "Updated" },
  { name: "NavigationMenu", status: "Deprecated" },
]

export function ReleaseBadges({
  items = defaultItems,
  className,
  ...props
}: ReleaseBadgesProps) {
  return (
    <div
      data-slot="release-badges"
      className={cn("not-typeset flex flex-col gap-4", className)}
      {...props}
    >
      <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3">
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
            <li
              key={index}
              className="flex items-center justify-between rounded-xl border border-border bg-card p-3.5 text-card-foreground shadow-xs"
            >
              <span className="font-medium text-sm">{item.name}</span>
              <Badge className={badgeClassName}>{item.status}</Badge>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
