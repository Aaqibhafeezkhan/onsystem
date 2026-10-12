import { Badge } from "@/registry/new-york-v4/ui/badge"

type ReleaseStatus = "New" | "Updated" | "Deprecated"

type ReleaseComponent = {
  name: string
  status: ReleaseStatus
}

const defaultComponents: ReleaseComponent[] = [
  { name: "Input Group", status: "New" },
  { name: "Button", status: "Updated" },
  { name: "Toast", status: "Deprecated" },
]

const statusClasses: Record<ReleaseStatus, string> = {
  New: "bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-300",
  Updated: "bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300",
  Deprecated: "bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300",
}

export function ReleaseBadges({
  components = defaultComponents,
}: {
  components?: readonly ReleaseComponent[]
} = {}) {
  return (
    <ul
      aria-label="Component release statuses"
      className="divide-y divide-border rounded-lg border border-border bg-background text-foreground"
    >
      {components.map((component) => (
        <li
          key={component.name}
          className="flex items-center justify-between gap-4 px-4 py-3"
        >
          <span className="text-sm font-medium">{component.name}</span>
          <Badge variant="secondary" className={statusClasses[component.status]}>
            {component.status}
          </Badge>
        </li>
      ))}
    </ul>
  )
}
