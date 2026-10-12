import { Badge } from "@/registry/new-york-v4/ui/badge"

type ReleaseStatus = "New" | "Updated" | "Deprecated"

const statusClassNames: Record<ReleaseStatus, string> = {
  New: "bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-300",
  Updated: "bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300",
  Deprecated: "bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300",
}

const releases: { name: string; status: ReleaseStatus }[] = [
  { name: "Accordion", status: "Updated" },
  { name: "Attachment", status: "New" },
  { name: "Bubble", status: "New" },
  { name: "Combobox", status: "Updated" },
  { name: "Toaster", status: "Deprecated" },
]

export function ReleaseBadges() {
  return (
    <ul className="flex flex-col gap-2">
      {releases.map(({ name, status }) => (
        <li key={name} className="flex items-center justify-between gap-4">
          <span className="text-sm text-foreground">{name}</span>
          <Badge variant="outline" className={statusClassNames[status]}>
            {status}
          </Badge>
        </li>
      ))}
    </ul>
  )
}
