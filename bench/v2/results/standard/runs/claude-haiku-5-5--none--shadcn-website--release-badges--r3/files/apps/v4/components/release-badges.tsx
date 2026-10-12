import { cn } from "cn"

import { Badge } from "@/registry/new-york-v4/ui/badge"

type ReleaseStatus = "New" | "Updated" | "Deprecated"

const statusStyles: Record<ReleaseStatus, string> = {
  New: "bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-300",
  Updated: "bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300",
  Deprecated: "bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300",
}

export type ReleaseItem = {
  name: string
  status: ReleaseStatus
}

const defaultItems: ReleaseItem[] = [
  { name: "Button", status: "Updated" },
  { name: "Card", status: "New" },
  { name: "Badge", status: "New" },
  { name: "Toast", status: "Deprecated" },
]

export function ReleaseBadges({
  items = defaultItems,
  className,
}: {
  items?: ReleaseItem[]
  className?: string
}) {
  return (
    <ul className={cn("flex flex-col gap-2", className)}>
      {items.map((item) => (
        <li
          key={item.name}
          className="flex items-center justify-between gap-2"
        >
          <span className="text-sm font-medium text-foreground">
            {item.name}
          </span>
          <Badge
            variant="secondary"
            className={cn(statusStyles[item.status])}
          >
            {item.status}
          </Badge>
        </li>
      ))}
    </ul>
  )
}
