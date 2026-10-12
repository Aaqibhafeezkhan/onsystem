import { Badge } from "@/registry/new-york-v4/ui/badge"

type ReleaseStatus = "New" | "Updated" | "Deprecated"

const components: { name: string; status: ReleaseStatus }[] = [
  { name: "Spinner", status: "New" },
  { name: "Button Group", status: "New" },
  { name: "Input Group", status: "Updated" },
  { name: "Toast", status: "Deprecated" },
]

const statusStyles: Record<ReleaseStatus, string> = {
  New: "bg-green-500/10 text-green-700 dark:text-green-400",
  Updated: "bg-blue-500/10 text-blue-700 dark:text-blue-400",
  Deprecated: "bg-amber-500/10 text-amber-700 dark:text-amber-400",
}

export function ReleaseBadges() {
  return (
    <ul className="grid gap-3 sm:grid-cols-2">
      {components.map(({ name, status }) => (
        <li
          key={name}
          className="flex items-center justify-between gap-4 rounded-lg border bg-card px-4 py-3 text-sm text-card-foreground"
        >
          <span className="font-medium">{name}</span>
          <Badge className={statusStyles[status]}>{status}</Badge>
        </li>
      ))}
    </ul>
  )
}
