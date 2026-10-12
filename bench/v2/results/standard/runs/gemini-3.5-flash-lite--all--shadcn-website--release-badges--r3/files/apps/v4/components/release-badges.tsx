import * as React from "react"

import { Badge } from "@/registry/new-york-v4/ui/badge"
import { Item, ItemContent, ItemTitle } from "@/registry/new-york-v4/ui/item"

export interface ReleaseBadgeItem {
  name: string
  status: "New" | "Updated" | "Deprecated"
  description?: string
}

const DEFAULT_RELEASES: ReleaseBadgeItem[] = [
  { name: "Button", status: "Updated" },
  { name: "Badge", status: "New" },
  { name: "Alert", status: "Updated" },
  { name: "Accordion", status: "Deprecated" },
  { name: "Avatar", status: "New" },
  { name: "Dialog", status: "Updated" },
  { name: "DropdownMenu", status: "Deprecated" },
  { name: "Tabs", status: "New" },
]

export interface ReleaseBadgesProps extends React.ComponentProps<"div"> {
  items?: ReleaseBadgeItem[]
}

export function ReleaseBadges({
  items = DEFAULT_RELEASES,
  className,
  ...props
}: ReleaseBadgesProps) {
  return (
    <div className="flex flex-col gap-2" {...props}>
      {items.map((item) => (
        <Item
          key={item.name}
          variant="outline"
          size="sm"
          className="flex items-center justify-between"
        >
          <ItemContent>
            <ItemTitle className="font-medium text-foreground">
              {item.name}
            </ItemTitle>
          </ItemContent>
          <Badge
            variant="outline"
            style={{
              color:
                item.status === "New"
                  ? "var(--color-green-600)"
                  : item.status === "Updated"
                  ? "var(--color-blue-600)"
                  : "var(--color-amber-600)",
              borderColor:
                item.status === "New"
                  ? "var(--color-green-600)"
                  : item.status === "Updated"
                  ? "var(--color-blue-600)"
                  : "var(--color-amber-600)",
            }}
          >
            {item.status}
          </Badge>
        </Item>
      ))}
    </div>
  )
}
