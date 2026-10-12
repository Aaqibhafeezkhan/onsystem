import { Badge } from "@/registry/new-york-v4/ui/badge"

export type ReleaseStatus = "New" | "Updated" | "Deprecated"

export type ReleaseBadgeItem = {
  name: string
  status: ReleaseStatus
}

const statusStyles: Record<ReleaseStatus, string> = {
  New: "bg-green-500/10 text-green-700 dark:text-green-400",
  Updated: "bg-blue-500/10 text-blue-700 dark:text-blue-400",
  Deprecated: "bg-amber-500/10 text-amber-700 dark:text-amber-400",
}

export function ReleaseBadges({ items }: { items: ReleaseBadgeItem[] }) {
  return (
    <ul className="flex flex-wrap gap-2">
      {items.map(({ name, status }) => (
        <li key={`${name}-${status}`} className="flex items-center gap-2">
          <span className="text-sm font-medium">{name}</span>
          <Badge className={statusStyles[status]}>{status}</Badge>
        </li>
      ))}
    </ul>
  )
}
