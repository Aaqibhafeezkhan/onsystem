import { Badge } from "@/registry/new-york-v4/ui/badge"

const statusThemes = {
  New: "theme-green",
  Updated: "theme-blue",
  Deprecated: "theme-amber",
} as const

type ReleaseBadgesProps = {
  components: readonly {
    name: string
    status: keyof typeof statusThemes
  }[]
}

export function ReleaseBadges({ components }: ReleaseBadgesProps) {
  return (
    <ul aria-label="Component release statuses" className="grid gap-3">
      {components.map(({ name, status }) => (
        <li
          key={name}
          className="flex items-center justify-between gap-4 text-sm text-foreground"
        >
          <span className="font-medium">{name}</span>
          <span className={statusThemes[status]}>
            <Badge className="theme-container bg-chart-4 text-primary-foreground">
              {status}
            </Badge>
          </span>
        </li>
      ))}
    </ul>
  )
}
