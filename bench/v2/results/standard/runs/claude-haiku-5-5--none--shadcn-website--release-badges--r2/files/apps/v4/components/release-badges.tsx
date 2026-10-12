import { cn } from "cn"

import { Badge } from "@/registry/new-york-v4/ui/badge"

type ReleaseStatus = "New" | "Updated" | "Deprecated"

const statusStyles: Record<ReleaseStatus, string> = {
  New: "border-green-500/30 bg-green-500/10 text-green-700 dark:text-green-400",
  Updated: "border-blue-500/30 bg-blue-500/10 text-blue-700 dark:text-blue-400",
  Deprecated:
    "border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-400",
}

export interface ReleaseBadgeItem {
  name: string
  status: ReleaseStatus
}

export function ReleaseBadges({
  items,
  className,
}: {
  items: ReleaseBadgeItem[]
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
            variant="outline"
            data-status={item.status}
            className={cn(statusStyles[item.status])}
          >
            {item.status}
          </Badge>
        </li>
      ))}
    </ul>
  )
}
