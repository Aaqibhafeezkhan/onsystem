import { Badge } from "@/registry/new-york-v4/ui/badge"

const releases = [
  { name: "Accordion", status: "New" },
  { name: "Alert", status: "Updated" },
  { name: "Badge", status: "Updated" },
  { name: "Button", status: "New" },
  { name: "Card", status: "Deprecated" },
  { name: "Input", status: "Updated" },
] as const

const statusStyles = {
  New: "bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-300",
  Updated: "bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300",
  Deprecated: "bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300",
}

export function ReleaseBadges() {
  return (
    <ul className="flex flex-col gap-2">
      {releases.map(({ name, status }) => (
        <li key={name} className="flex items-center justify-between gap-4">
          <span className="text-sm">{name}</span>
          <Badge className={statusStyles[status]}>{status}</Badge>
        </li>
      ))}
    </ul>
  )
}
