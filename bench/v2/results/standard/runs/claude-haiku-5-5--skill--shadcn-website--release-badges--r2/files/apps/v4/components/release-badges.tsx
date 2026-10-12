import { Badge } from "@/registry/new-york-v4/ui/badge"

type ReleaseStatus = "New" | "Updated" | "Deprecated"

type ReleaseItem = {
  name: string
  status: ReleaseStatus
}

const statusClassName: Record<ReleaseStatus, string> = {
  New: "border-green-500/20 bg-green-500/10 text-green-700 dark:text-green-400",
  Updated:
    "border-blue-500/20 bg-blue-500/10 text-blue-700 dark:text-blue-400",
  Deprecated:
    "border-amber-500/20 bg-amber-500/10 text-amber-700 dark:text-amber-400",
}

const defaultItems: ReleaseItem[] = [
  { name: "Questionnaire", status: "New" },
  { name: "Button", status: "Updated" },
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
          className="flex items-center justify-between gap-2 text-sm text-foreground"
        >
          <span>{item.name}</span>
          <Badge variant="outline" className={statusClassName[item.status]}>
            {item.status}
          </Badge>
        </li>
      ))}
    </ul>
  )
}
