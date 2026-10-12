import { cn } from "@/lib/utils"
import { Badge } from "@/registry/new-york-v4/ui/badge"

type ReleaseStatus = "New" | "Updated" | "Deprecated"

const statusStyles: Record<ReleaseStatus, string> = {
  New: "bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300",
  Updated: "bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300",
  Deprecated:
    "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300",
}

type ReleaseItem = {
  name: string
  status: ReleaseStatus
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
          className="flex items-center justify-between gap-4 text-sm"
        >
          <span className="font-medium">{item.name}</span>
          <Badge variant="secondary" className={statusStyles[item.status]}>
            {item.status}
          </Badge>
        </li>
      ))}
    </ul>
  )
}
