import { Badge } from "@/registry/new-york-v4/ui/badge"

type ReleaseStatus = "New" | "Updated" | "Deprecated"

type ReleaseItem = {
  name: string
  status: ReleaseStatus
}

const items: ReleaseItem[] = [
  { name: "Attachment", status: "New" },
  { name: "Marker", status: "New" },
  { name: "Button", status: "Updated" },
  { name: "Field", status: "Updated" },
  { name: "Toggle", status: "Deprecated" },
]

// Status colours are not in the design system's token set, so they are
// defined here in one place.
const statusClasses: Record<ReleaseStatus, string> = {
  New: "border-green-600 text-green-700 dark:border-green-400 dark:text-green-400",
  Updated: "border-blue-600 text-blue-700 dark:border-blue-400 dark:text-blue-400",
  Deprecated:
    "border-amber-600 text-amber-700 dark:border-amber-400 dark:text-amber-400",
}

export function ReleaseBadges() {
  return (
    <ul className="flex flex-col gap-2">
      {items.map((item) => (
        <li key={item.name} className="flex items-center justify-between gap-2">
          <span className="text-sm font-medium text-foreground">{item.name}</span>
          <Badge variant="outline" className={statusClasses[item.status]}>
            {item.status}
          </Badge>
        </li>
      ))}
    </ul>
  )
}
