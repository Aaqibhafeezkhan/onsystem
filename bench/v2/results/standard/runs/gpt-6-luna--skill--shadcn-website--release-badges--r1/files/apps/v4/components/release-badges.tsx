import { Badge } from "@/registry/new-york-v4/ui/badge"

const releaseComponents = [
  { name: "Questionnaire", status: "New" },
  { name: "Badge", status: "Updated" },
  { name: "Form", status: "Deprecated" },
] as const

type ReleaseStatus = (typeof releaseComponents)[number]["status"]

type ReleaseComponent = {
  name: string
  status: ReleaseStatus
}

const statusClasses: Record<ReleaseStatus, string> = {
  New: "bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-300",
  Updated: "bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300",
  Deprecated: "bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300",
}

export function ReleaseBadges({
  components = releaseComponents,
}: {
  components?: readonly ReleaseComponent[]
}) {
  return (
    <ul className="flex flex-wrap gap-2">
      {components.map(({ name, status }) => (
        <li key={name} className="flex items-center gap-2">
          <span>{name}</span>
          <Badge className={statusClasses[status]}>{status}</Badge>
        </li>
      ))}
    </ul>
  )
}
