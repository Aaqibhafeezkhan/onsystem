import { Badge } from "@/registry/new-york-v4/ui/badge"

const releases = [
  { name: "Questionnaire", status: "New" },
  { name: "Chart", status: "Updated" },
  { name: "Resizable", status: "Updated" },
  { name: "Legacy Button", status: "Deprecated" },
] as const

const statusStyles = {
  New: "border-green-500/20 bg-green-500/10 text-green-700 dark:text-green-400",
  Updated: "border-blue-500/20 bg-blue-500/10 text-blue-700 dark:text-blue-400",
  Deprecated:
    "border-amber-500/20 bg-amber-500/10 text-amber-700 dark:text-amber-400",
} as const

export function ReleaseBadges() {
  return (
    <ul className="flex flex-wrap gap-3">
      {releases.map(({ name, status }) => (
        <li key={name} className="flex items-center gap-2">
          <span className="text-sm font-medium">{name}</span>
          <Badge variant="outline" className={statusStyles[status]}>
            {status}
          </Badge>
        </li>
      ))}
    </ul>
  )
}
