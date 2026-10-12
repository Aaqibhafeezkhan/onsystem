import { Badge } from "@/registry/new-york-v4/ui/badge"

type ReleaseStatus = "New" | "Updated" | "Deprecated"

type ReleaseBadgeItem = {
  name: string
  status: ReleaseStatus
}

const releaseComponents: ReleaseBadgeItem[] = [
  { name: "Accordion", status: "New" },
  { name: "Badge", status: "Updated" },
  { name: "Button", status: "Updated" },
  { name: "Card", status: "New" },
  { name: "Dialog", status: "Deprecated" },
]

const statusStyles: Record<ReleaseStatus, string> = {
  New: "border-transparent bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
  Updated:
    "border-transparent bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
  Deprecated:
    "border-transparent bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300",
}

export function ReleaseBadges({
  items = releaseComponents,
}: {
  items?: readonly ReleaseBadgeItem[]
}) {
  return (
    <ul className="flex flex-wrap gap-2">
      {items.map(({ name, status }) => (
        <li key={name} className="inline-flex items-center gap-2">
          <span>{name}</span>
          <Badge className={statusStyles[status]}>{status}</Badge>
        </li>
      ))}
    </ul>
  )
}
