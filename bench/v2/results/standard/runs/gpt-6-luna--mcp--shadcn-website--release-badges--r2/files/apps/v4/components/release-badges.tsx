import { Badge } from "@/registry/new-york-v4/ui/badge"

type ReleaseStatus = "New" | "Updated" | "Deprecated"

type ReleaseComponent = {
  name: string
  status: ReleaseStatus
}

const statusStyles: Record<ReleaseStatus, string> = {
  New: "bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-300",
  Updated: "bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300",
  Deprecated:
    "bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300",
}

export function ReleaseBadges({
  components,
}: {
  components: ReleaseComponent[]
}) {
  return (
    <ul className="flex flex-wrap gap-2">
      {components.map(({ name, status }) => (
        <li key={name} className="flex items-center gap-2">
          <span>{name}</span>
          <Badge className={statusStyles[status]}>{status}</Badge>
        </li>
      ))}
    </ul>
  )
}
