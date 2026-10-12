import { Badge } from "@/registry/new-york-v4/ui/badge"

type ReleaseStatus = "New" | "Updated" | "Deprecated"

type ReleaseComponent = {
  name: string
  status: ReleaseStatus
}

type ReleaseBadgesProps = {
  components: ReleaseComponent[]
}

const statusClasses: Record<ReleaseStatus, string> = {
  New: "border-transparent bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-300",
  Updated:
    "border-transparent bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300",
  Deprecated:
    "border-transparent bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300",
}

export function ReleaseBadges({ components }: ReleaseBadgesProps) {
  return (
    <ul className="flex flex-col gap-2">
      {components.map(({ name, status }) => (
        <li key={name} className="flex items-center justify-between gap-2">
          <span>{name}</span>
          <Badge className={statusClasses[status]}>{status}</Badge>
        </li>
      ))}
    </ul>
  )
}
