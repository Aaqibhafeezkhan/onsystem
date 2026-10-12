import { Badge } from "@/registry/new-york-v4/ui/badge"

type ReleaseStatus = "New" | "Updated" | "Deprecated"

type ReleaseItem = {
  name: string
  status: ReleaseStatus
}

const statusClassNames: Record<ReleaseStatus, string> = {
  New: "bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-300",
  Updated: "bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300",
  Deprecated:
    "bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300",
}

function ReleaseBadges({ items }: { items: ReleaseItem[] }) {
  return (
    <ul className="flex flex-col gap-2">
      {items.map((item) => (
        <li
          key={item.name}
          className="flex items-center justify-between gap-2"
        >
          <span className="text-sm font-medium text-foreground">
            {item.name}
          </span>
          <Badge variant="outline" className={statusClassNames[item.status]}>
            {item.status}
          </Badge>
        </li>
      ))}
    </ul>
  )
}

export { ReleaseBadges }
export type { ReleaseItem, ReleaseStatus }
