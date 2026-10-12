import { Badge } from "@/registry/new-york-v4/ui/badge"

type ReleaseStatus = "New" | "Updated" | "Deprecated"

type ReleaseEntry = {
  name: string
  status: ReleaseStatus
}

// The design system has no semantic status tokens, so the status hues use
// the Tailwind palette classes already used across the app for badges.
const statusClassNames: Record<ReleaseStatus, string> = {
  New: "border-green-200 bg-green-50 text-green-700 dark:border-green-900 dark:bg-green-950 dark:text-green-300",
  Updated:
    "border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-900 dark:bg-blue-950 dark:text-blue-300",
  Deprecated:
    "border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-300",
}

const releases: ReleaseEntry[] = [
  { name: "Attachment", status: "New" },
  { name: "Bubble", status: "New" },
  { name: "Marker", status: "New" },
  { name: "Item", status: "Updated" },
  { name: "Field", status: "Updated" },
  { name: "Toggle", status: "Deprecated" },
]

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
          <Badge variant="outline" className={statusClassNames[release.status]}>
            {release.status}
          </Badge>
        </li>
      ))}
    </ul>
  )
}
