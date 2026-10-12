import * as React from "react"

import { Badge } from "@/registry/new-york-v4/ui/badge"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/registry/new-york-v4/ui/card"
import {
  Item,
  ItemContent,
  ItemGroup,
  ItemTitle,
} from "@/registry/new-york-v4/ui/item"

const releaseItems = [
  { name: "Button", status: "Updated" },
  { name: "Combobox", status: "New" },
  { name: "Command", status: "Updated" },
  { name: "Dialog", status: "Deprecated" },
  { name: "Input", status: "Updated" },
  { name: "Popover", status: "New" },
  { name: "Select", status: "Deprecated" },
  { name: "Tooltip", status: "New" },
] as const

export function ReleaseBadges() {
  return (
    <Card className="w-full max-w-md gap-4">
      <CardHeader>
        <CardTitle>Release Status</CardTitle>
        <CardDescription>
          Recent component updates, additions, and deprecations.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ItemGroup>
          {releaseItems.map((item) => {
            const statusVariant =
              item.status === "New"
                ? "bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-300"
                : item.status === "Updated"
                  ? "bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300"
                  : "bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300"

            return (
              <Item key={item.name} className="px-0 py-2.5">
                <ItemContent>
                  <ItemTitle className="font-medium">{item.name}</ItemTitle>
                </ItemContent>
                <Badge variant="outline" className={statusVariant}>
                  {item.status}
                </Badge>
              </Item>
            )
          })}
        </ItemGroup>
      </CardContent>
    </Card>
  )
}
