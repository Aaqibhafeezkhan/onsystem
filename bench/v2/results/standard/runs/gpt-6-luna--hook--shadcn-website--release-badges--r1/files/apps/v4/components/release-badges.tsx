import { Badge } from "@/registry/new-york-v4/ui/badge"

const components = [
  { name: "MessageScroller", status: "New" },
  { name: "Message", status: "New" },
  { name: "Bubble", status: "New" },
  { name: "Attachment", status: "New" },
  { name: "Marker", status: "New" },
  { name: "Calendar", status: "Updated" },
  { name: "Button", status: "Updated" },
  { name: "Dialog", status: "Updated" },
  { name: "Toast", status: "Deprecated" },
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
      {components.map(({ name, status }) => (
        <li key={name} className="inline-flex items-center gap-2">
          <span className="text-sm font-medium">{name}</span>
          <Badge variant="outline" className={statusStyles[status]}>
            {status}
          </Badge>
        </li>
      ))}
    </ul>
  )
}
