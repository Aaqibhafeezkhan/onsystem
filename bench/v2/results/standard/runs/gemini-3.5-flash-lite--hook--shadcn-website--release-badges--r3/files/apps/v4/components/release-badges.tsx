import * as React from "react"
import { cn } from "cn"

import { Badge } from "@/registry/new-york-v4/ui/badge"

export interface ReleaseBadgeItem {
  name: string
  status: "New" | "Updated" | "Deprecated"
}

const defaultItems: ReleaseBadgeItem[] = [
  { name: "InputGroup", status: "New" },
  { name: "Button", status: "Updated" },
  { name: "Card", status: "Updated" },
  { name: "DropdownMenu", status: "Deprecated" },
  { name: "Dialog", status: "Updated" },
  { name: "Sidebar", status: "New" },
]

export function ReleaseBadges({
  items = defaultItems,
  className,
  ...props
}: React.ComponentProps<"div"> & {
  items?: ReleaseBadgeItem[]
}) {
  return (
    <div
      className={cn("not-typeset flex flex-col gap-3", className)}
      {...props}
    >
      {items.map((item, index) => {
        const { name, status } = item
        let badgeClassName = ""

        switch (status) {
          case "New":
            badgeClassName =
              "bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-300 border-green-200 dark:border-green-900"
            break
          case "Updated":
            badgeClassName =
              "bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300 border-blue-200 dark:border-blue-900"
            break
          case "Deprecated":
            badgeClassName =
              "bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300 border-amber-200 dark:border-amber-900"
            break
        }

        return (
          <div
            key={`${name}-${index}`}
            className="flex items-center justify-between rounded-xl border border-border/60 bg-card p-4 text-card-foreground shadow-xs transition-colors hover:bg-accent/50"
          >
            <span className="font-medium">{name}</span>
            <Badge variant="outline" className={badgeClassName}>
              {status}
            </Badge>
          </div>
        )
      })}
    </div>
  )
}
