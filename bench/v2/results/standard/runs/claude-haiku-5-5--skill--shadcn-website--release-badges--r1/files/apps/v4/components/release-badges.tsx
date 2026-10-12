import { Badge } from "@/registry/new-york-v4/ui/badge"
import { cn } from "cn"

type ReleaseStatus = "New" | "Updated" | "Deprecated"

type ReleaseItem = {
  name: string
  status: ReleaseStatus
}

const statusStyles: Record<ReleaseStatus, string> = {
  New: "border-green-500/30 bg-green-500/10 text-green-700 dark:text-green-400",
  Updated: "border-blue-500/30 bg-blue-500/10 text-blue-700 dark:text-blue-400",
  Deprecated:
    "border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-400",
}

export function ReleaseBadges({
  items,
  className,
}: {
  items: ReleaseItem[]
  className?: string
}) {
  return (
    <ul className={cn("flex flex-col gap-2", className)}>
      {items.map((item) => (
        <li
          key={item.name}
          className="flex items-center justify-between gap-2"
        >
          <span className="font-mono text-sm">{item.name}</span>
          <Badge
            variant="outline"
            data-status={item.status}
            className={statusStyles[item.status]}
          >
            {item.status}
          </Badge>
        </li>
      ))}
    </ul>
  )
}
