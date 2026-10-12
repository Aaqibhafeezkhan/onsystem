import { Badge } from "@/registry/new-york-v4/ui/badge"

type ReleaseStatus = "New" | "Updated" | "Deprecated"

type ReleaseItem = {
  name: string
  status: ReleaseStatus
}

const items: ReleaseItem[] = [
  { name: "Accordion", status: "New" },
  { name: "Attachment", status: "New" },
  { name: "Combobox", status: "Updated" },
  { name: "Form", status: "Updated" },
  { name: "Toast", status: "Deprecated" },
]

// The project has no green, blue or amber tokens, so each status maps to an
// existing Badge variant instead of a hardcoded palette color.
const statusVariant: Record<
  ReleaseStatus,
  "secondary" | "outline" | "destructive"
> = {
  New: "secondary",
  Updated: "outline",
  Deprecated: "destructive",
}

export function ReleaseBadges() {
  return (
    <ul className="flex flex-col gap-2">
      {items.map((item) => (
        <li
          key={item.name}
          className="flex items-center justify-between gap-4 text-foreground"
        >
          <span>{item.name}</span>
          <Badge variant={statusVariant[item.status]}>{item.status}</Badge>
        </li>
      ))}
    </ul>
  )
}
