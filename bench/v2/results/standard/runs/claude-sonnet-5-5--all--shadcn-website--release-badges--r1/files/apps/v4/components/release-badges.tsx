import { Badge } from "@/registry/new-york-v4/ui/badge"

type ReleaseStatus = "New" | "Updated" | "Deprecated"

const statusClasses: Record<ReleaseStatus, string> = {
  New: "border-transparent bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-300",
  Updated: "border-transparent bg-chart-1/30 text-chart-5 dark:text-chart-1",
  Deprecated:
    "border-transparent bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300",
}

export type ReleaseItem = {
  name: string
  status: ReleaseStatus
}

const defaultItems: ReleaseItem[] = [
  { name: "Button", status: "Updated" },
  { name: "Sidebar", status: "New" },
  { name: "Toast", status: "Deprecated" },
]

export function ReleaseBadges({
  items = defaultItems,
}: {
  items?: ReleaseItem[]
}) {
  return (
    <ul className="flex flex-col gap-2">
      {items.map((item) => (
        <li key={item.name} className="flex items-center gap-2 text-sm">
          <span className="text-foreground">{item.name}</span>
          <Badge variant="outline" className={statusClasses[item.status]}>
            {item.status}
          </Badge>
        </li>
      ))}
    </ul>
  )
}
