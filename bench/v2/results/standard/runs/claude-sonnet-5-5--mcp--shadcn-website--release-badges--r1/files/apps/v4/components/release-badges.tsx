import { Badge } from "@/registry/new-york-v4/ui/badge"

type ReleaseStatus = "New" | "Updated" | "Deprecated"

const statusClasses: Record<ReleaseStatus, string> = {
  New: "border-transparent bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300",
  Updated:
    "border-transparent bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300",
  Deprecated:
    "border-transparent bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300",
}

const defaultItems: { name: string; status: ReleaseStatus }[] = [
  { name: "Sidebar", status: "New" },
  { name: "Button", status: "Updated" },
  { name: "Toast", status: "Deprecated" },
]

export function ReleaseBadges({
  items = defaultItems,
}: {
  items?: { name: string; status: ReleaseStatus }[]
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
