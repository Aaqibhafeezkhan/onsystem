import { Badge } from "@/registry/new-york-v4/ui/badge"

export type ReleaseStatus = "New" | "Updated" | "Deprecated"

export type ReleaseBadgesProps = {
  components: readonly {
    name: string
    status: ReleaseStatus
  }[]
}

// This project's tokens include blue, but no green or amber status colors.
// Keep neutral fallbacks rather than introducing unsupported palette colors.
const statusClasses: Record<ReleaseStatus, string> = {
  New: "bg-secondary text-secondary-foreground",
  Updated: "bg-chart-3/10 text-chart-3 dark:text-chart-1",
  Deprecated: "bg-muted text-muted-foreground",
}

export function ReleaseBadges({ components }: ReleaseBadgesProps) {
  return (
    <ul aria-label="Component release statuses" className="grid gap-2">
      {components.map((component) => (
        <li
          key={component.name}
          className="flex items-center justify-between gap-4 text-foreground"
        >
          <span>{component.name}</span>
          <Badge variant="outline" className={statusClasses[component.status]}>
            {component.status}
          </Badge>
        </li>
      ))}
    </ul>
  )
}
