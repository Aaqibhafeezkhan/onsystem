import { Badge } from "@/registry/new-york-v4/ui/badge"

type ReleaseStatus = "New" | "Updated" | "Deprecated"

const releases: { name: string; status: ReleaseStatus }[] = [
  { name: "Attachment", status: "New" },
  { name: "Marker", status: "New" },
  { name: "Bubble", status: "Updated" },
  { name: "Item", status: "Updated" },
  { name: "Form", status: "Deprecated" },
]

const statusClassName: Record<ReleaseStatus, string> = {
  New: "bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-300",
  Updated: "bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300",
  Deprecated: "bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300",
}

export function ReleaseBadges() {
  return (
    <ul className="flex flex-col gap-2">
      {releases.map((release) => (
        <li
          key={release.name}
          className="flex items-center justify-between gap-2"
        >
          <span className="text-sm text-foreground">{release.name}</span>
          <Badge variant="outline" className={statusClassName[release.status]}>
            {release.status}
          </Badge>
        </li>
      ))}
    </ul>
  )
}
