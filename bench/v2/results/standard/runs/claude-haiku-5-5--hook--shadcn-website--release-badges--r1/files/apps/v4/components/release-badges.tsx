import { Badge } from "@/registry/new-york-v4/ui/badge"

type ReleaseStatus = "New" | "Updated" | "Deprecated"

type ReleaseItem = {
  name: string
  status: ReleaseStatus
}

const statusStyles: Record<ReleaseStatus, string> = {
  New: "border-green-200 bg-green-50 text-green-700 dark:border-green-900 dark:bg-green-950 dark:text-green-300",
  Updated:
    "border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-900 dark:bg-blue-950 dark:text-blue-300",
  Deprecated:
    "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-300",
}

const defaultItems: ReleaseItem[] = [
  { name: "Button", status: "Updated" },
  { name: "Combobox", status: "New" },
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
        <li
          key={item.name}
          className="flex items-center justify-between gap-4"
        >
          <span className="text-sm font-medium text-foreground">
            {item.name}
          </span>
          <Badge variant="outline" className={statusStyles[item.status]}>
            {item.status}
          </Badge>
        </li>
      ))}
    </ul>
  )
}
