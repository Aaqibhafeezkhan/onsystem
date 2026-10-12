import { Badge } from "@/registry/new-york-v4/ui/badge"

type ReleaseStatus = "New" | "Updated" | "Deprecated"

const releases: { name: string; status: ReleaseStatus }[] = [
  { name: "Button", status: "New" },
  { name: "Card", status: "Updated" },
  { name: "Select", status: "Deprecated" },
]

// Status colors. Green and amber have no tokens in this design system yet,
// so they fall back to the neutral outline; blue uses the chart-2 token.
const statusClasses: Record<ReleaseStatus, string> = {
  New: "border-muted-foreground text-muted-foreground",
  Updated: "border-chart-2 bg-chart-2/10 text-chart-2",
  Deprecated: "border-muted-foreground text-muted-foreground",
}

export function ReleaseBadges() {
  return (
    <ul className="flex flex-col gap-2">
      {releases.map((release) => (
        <li
          key={release.name}
          className="flex items-center justify-between gap-4"
        >
          <span className="text-sm font-medium text-foreground">
            {release.name}
          </span>
          <Badge variant="outline" className={statusClasses[release.status]}>
            {release.status}
          </Badge>
        </li>
      ))}
    </ul>
  )
}
