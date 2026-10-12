import { Badge } from "@/registry/new-york-v4/ui/badge"

type ReleaseStatus = "New" | "Updated" | "Deprecated"

type ReleaseComponent = {
  name: string
  status: ReleaseStatus
}

const statusThemes: Record<ReleaseStatus, string> = {
  New: "theme-green",
  Updated: "theme-blue",
  Deprecated: "theme-amber",
}

const defaultComponents: readonly ReleaseComponent[] = [
  { name: "Item", status: "New" },
  { name: "Button", status: "Updated" },
  { name: "Toast", status: "Deprecated" },
]

export function ReleaseBadges({
  components = defaultComponents,
}: {
  components?: readonly ReleaseComponent[]
}) {
  return (
    <ul aria-label="Component releases" className="grid gap-2">
      {components.map((component, index) => (
        <li
          key={`${component.name}-${index}`}
          className="flex items-center justify-between gap-4 text-foreground"
        >
          <span>{component.name}</span>
          <span className={statusThemes[component.status]}>
            {/* Existing themes scope chart tokens to their theme-container. */}
            <Badge
              variant="outline"
              className="theme-container border-chart-3/30 bg-chart-3/10 text-chart-4 dark:text-chart-1"
            >
              {component.status}
            </Badge>
          </span>
        </li>
      ))}
    </ul>
  )
}
