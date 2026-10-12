import * as React from "react"

import { Badge } from "@/registry/new-york-v4/ui/badge"
import { cn } from "cn"

export interface ReleaseBadgesProps extends React.HTMLAttributes<HTMLDivElement> {}

interface ComponentRelease {
  name: string
  status: "New" | "Updated" | "Deprecated"
}

const releases: ComponentRelease[] = [
  { name: "Accordion", status: "New" },
  { name: "AlertDialog", status: "Updated" },
  { name: "Alert", status: "Deprecated" },
  { name: "Avatar", status: "New" },
  { name: "Button", status: "Updated" },
  { name: "Checkbox", status: "Deprecated" },
  { name: "Dialog", status: "New" },
  { name: "DropdownMenu", status: "Updated" },
  { name: "Popover", status: "Deprecated" },
  { name: "Tabs", status: "New" },
  { name: "Tooltip", status: "Updated" },
]

export function ReleaseBadges({ className, ...props }: ReleaseBadgesProps) {
  return (
    <div className={cn("flex flex-col gap-3", className)} {...props}>
      {releases.map((release) => {
        const statusVariant =
          release.status === "New"
            ? "bg-chart-1 text-chart-1-foreground"
            : release.status === "Updated"
            ? "bg-chart-2 text-chart-2-foreground"
            : "bg-chart-3 text-chart-3-foreground"

        return (
          <div
            key={release.name}
            className="flex items-center justify-between rounded-lg border p-3"
          >
            <span className="font-medium">{release.name}</span>
            <Badge className={statusVariant}>{release.status}</Badge>
          </div>
        )
      })}
    </div>
  )
}
