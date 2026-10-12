import { Badge } from "@/registry/new-york-v4/ui/badge"

type ReleaseStatus = "New" | "Updated" | "Deprecated"

type ReleaseBadgeItem = {
  component: string
  status: ReleaseStatus
}

const statusClasses: Record<ReleaseStatus, string> = {
  New: "bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-300",
  Updated: "bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300",
  Deprecated: "bg-amber-50 text-amber-800 dark:bg-amber-950 dark:text-amber-300",
}

export function ReleaseBadges({
  items,
}: {
  items: ReleaseBadgeItem[]
}) {
  return (
    <ul className="flex flex-col gap-2">
      {items.map(({ component, status }) => (
        <li
          key={component}
          className="flex items-center justify-between gap-4"
        >
          <span className="text-foreground">{component}</span>
          <Badge className={statusClasses[status]}>{status}</Badge>
        </li>
      ))}
    </ul>
  )
}
