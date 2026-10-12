import * as React from "react"
import { Badge } from "@/registry/new-york-v4/ui/badge"
import { cn } from "@/lib/utils"

export interface ReleaseBadgeItem {
  name: string
  status: "New" | "Updated" | "Deprecated"
}

export interface ReleaseBadgesProps extends React.ComponentProps<"div"> {
  items?: ReleaseBadgeItem[]
}

const defaultItems: ReleaseBadgeItem[] = [
  { name: "Accordion", status: "Updated" },
  { name: "Attachment", status: "New" },
  { name: "Avatar", status: "Updated" },
  { name: "Bubble", status: "New" },
  { name: "ButtonGroup", status: "Updated" },
  { name: "Calendar", status: "Deprecated" },
  { name: "Combobox", status: "New" },
  { name: "Empty", status: "New" },
  { name: "Field", status: "New" },
  { name: "InputGroup", status: "New" },
  { name: "Message", status: "Updated" },
  { name: "NativeSelect", status: "Deprecated" },
]

export function ReleaseBadges({
  items = defaultItems,
  className,
  ...props
}: ReleaseBadgesProps) {
  return (
    <div
      className={cn("flex flex-col gap-3", className)}
      {...props}
    >
      <ul className="grid gap-2 sm:grid-cols-2 md:grid-cols-3">
        {items.map((item, index) => {
          let statusBadgeClass = ""
          if (item.status === "New") {
            statusBadgeClass = "bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-300"
          } else if (item.status === "Updated") {
            statusBadgeClass = "bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300"
          } else if (item.status === "Deprecated") {
            statusBadgeClass = "bg-amber-50 text-amber-900 dark:bg-amber-950 dark:text-amber-50"
          }

          return (
            <li
              key={`${item.name}-${index}`}
              className="flex items-center justify-between rounded-lg border border-border bg-card p-3 text-card-foreground shadow-xs"
            >
              <span className="font-medium">{item.name}</span>
              <Badge variant="outline" className={cn("font-medium", statusBadgeClass)}>
                {item.status}
              </Badge>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
