import { Badge } from "@/registry/new-york-v4/ui/badge"

const components = [
  { name: "Button", status: "New" },
  { name: "Input", status: "Updated" },
  { name: "Select", status: "Updated" },
  { name: "Dialog", status: "Deprecated" },
] as const

const statusStyles = {
  New: "bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-300",
  Updated: "bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300",
  Deprecated: "bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300",
} as const

export function ReleaseBadges() {
  return (
    <ul className="grid gap-2 sm:grid-cols-2">
      {components.map(({ name, status }) => (
        <li
          key={name}
          className="flex items-center justify-between gap-4 rounded-lg border border-border px-4 py-3"
        >
          <span className="text-sm font-medium">{name}</span>
          <Badge variant="secondary" className={statusStyles[status]}>
            {status}
          </Badge>
        </li>
      ))}
    </ul>
  )
}
