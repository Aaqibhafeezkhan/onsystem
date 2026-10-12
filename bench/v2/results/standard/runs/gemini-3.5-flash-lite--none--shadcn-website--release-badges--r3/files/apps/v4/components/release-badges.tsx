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
  { name: "Accordion", status: "New" },
  { name: "Alert", status: "Updated" },
  { name: "Avatar", status: "Deprecated" },
  { name: "Badge", status: "New" },
  { name: "Button", status: "Updated" },
  { name: "Card", status: "Deprecated" },
  { name: "Checkbox", status: "New" },
  { name: "Collapsible", status: "Updated" },
  { name: "Dialog", status: "Deprecated" },
]

export function ReleaseBadges({
  items = defaultItems,
  className,
  ...props
}: ReleaseBadgesProps) {
  return (
    <div
      data-slot="release-badges"
      className={cn(
        "not-typeset grid gap-3 sm:grid-cols-2 md:grid-cols-3",
        className
      )}
      {...props}
    >
      {items.map((item) => {
        const isNew = item.status === "New"
        const isUpdated = item.status === "Updated"
        const isDeprecated = item.status === "Deprecated"

        return (
          <div
            key={item.name}
            className="flex items-center justify-between gap-2 rounded-xl border border-border bg-card p-4 text-card-foreground shadow-sm"
          >
            <span className="font-medium text-card-foreground">{item.name}</span>
            <Badge
              variant="outline"
              className={cn(
                "font-medium",
                isNew &&
                  "bg-green-50 text-green-700 border-green-200 dark:bg-green-950 dark:text-green-300 dark:border-green-900",
                isUpdated &&
                  "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950 dark:text-blue-300 dark:border-blue-900",
                isDeprecated &&
                  "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950 dark:text-amber-300 dark:border-amber-900"
              )}
            >
              {item.status}
            </Badge>
          </div>
        )
      })}
    </div>
  )
}
