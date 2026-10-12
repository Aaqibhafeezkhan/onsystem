import { cn } from "@/lib/utils"
import { Badge } from "@/registry/new-york-v4/ui/badge"

type ReleaseStatus = "New" | "Updated" | "Deprecated"

type ReleaseComponent = {
  name: string
  status: ReleaseStatus
}

const defaultComponents: ReleaseComponent[] = [
  { name: "Item", status: "New" },
  { name: "Calendar", status: "Updated" },
  { name: "Toast", status: "Deprecated" },
]

const statusClasses: Record<ReleaseStatus, string> = {
  New: "border-green-200 bg-green-50 text-green-700 dark:border-green-800 dark:bg-green-950 dark:text-green-300",
  Updated:
    "border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-800 dark:bg-blue-950 dark:text-blue-300",
  Deprecated:
    "border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-300",
}

export function ReleaseBadges({
  components = defaultComponents,
  className,
}: {
  components?: ReleaseComponent[]
  className?: string
} = {}) {
  return (
    <ul
      aria-label="Component release statuses"
      data-not-typeset
      className={cn(
        "m-0 list-none divide-y divide-border rounded-lg border border-border bg-card p-0 text-card-foreground",
        className
      )}
    >
      {components.map((component) => (
        <li
          key={component.name}
          className="flex items-center justify-between gap-4 px-4 py-3"
        >
          <span className="min-w-0 text-sm font-medium break-words">
            {component.name}
          </span>
          <Badge variant="outline" className={statusClasses[component.status]}>
            {component.status}
          </Badge>
        </li>
      ))}
    </ul>
  )
}
