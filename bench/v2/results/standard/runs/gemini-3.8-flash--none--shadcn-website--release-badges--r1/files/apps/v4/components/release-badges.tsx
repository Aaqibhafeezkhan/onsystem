import * as React from "react"
import { cn } from "cn"

import { Badge } from "@/registry/new-york-v4/ui/badge"

export type ReleaseStatus =
  | "New"
  | "Updated"
  | "Deprecated"
  | "new"
  | "updated"
  | "deprecated"

export interface ComponentReleaseItem {
  name: string
  status: ReleaseStatus
  description?: string
  href?: string
}

const STATUS_CONFIG: Record<string, { label: string; className: string }> = {
  new: {
    label: "New",
    className:
      "border-green-200 bg-green-50 text-green-700 dark:border-green-800 dark:bg-green-950/50 dark:text-green-300",
  },
  updated: {
    label: "Updated",
    className:
      "border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-800 dark:bg-blue-950/50 dark:text-blue-300",
  },
  deprecated: {
    label: "Deprecated",
    className:
      "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-800 dark:bg-amber-950/50 dark:text-amber-300",
  },
}

export const DEFAULT_COMPONENTS: ComponentReleaseItem[] = [
  { name: "Questionnaire", status: "New" },
  { name: "Dynamic Search", status: "New" },
  { name: "Button Group", status: "Updated" },
  { name: "Input Group", status: "Updated" },
  { name: "Field", status: "Updated" },
  { name: "Toast", status: "Deprecated" },
]

export interface ReleaseBadgesProps
  extends React.HTMLAttributes<HTMLDivElement> {
  items?: ComponentReleaseItem[]
  components?: ComponentReleaseItem[]
}

export function ReleaseBadges({
  items,
  components,
  className,
  ...props
}: ReleaseBadgesProps) {
  const list = items ?? components ?? DEFAULT_COMPONENTS

  return (
    <div
      role="list"
      className={cn(
        "divide-y divide-border rounded-lg border border-border bg-card text-card-foreground shadow-xs",
        className
      )}
      {...props}
    >
      {list.map((item) => {
        const config =
          STATUS_CONFIG[item.status.toLowerCase()] ?? {
            label: item.status,
            className: "border-border bg-secondary text-secondary-foreground",
          }

        return (
          <div
            key={item.name}
            role="listitem"
            className="flex items-center justify-between gap-4 px-4 py-3 text-sm"
          >
            {item.href ? (
              <a
                href={item.href}
                className="font-medium text-foreground underline-offset-4 hover:underline"
              >
                {item.name}
              </a>
            ) : (
              <span className="font-medium text-foreground">{item.name}</span>
            )}
            <Badge
              variant="outline"
              className={cn("shrink-0 font-medium", config.className)}
            >
              {config.label}
            </Badge>
          </div>
        )
      })}
    </div>
  )
}

export default ReleaseBadges
