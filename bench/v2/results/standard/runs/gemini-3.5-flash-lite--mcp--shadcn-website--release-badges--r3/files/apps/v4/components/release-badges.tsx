import { Badge } from "@/registry/new-york-v4/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/registry/new-york-v4/ui/card"

interface ReleaseItem {
  name: string
  status: "New" | "Updated" | "Deprecated"
}

const releases: ReleaseItem[] = [
  { name: "Accordion", status: "New" },
  { name: "Alert", status: "Updated" },
  { name: "AlertDialog", status: "Deprecated" },
  { name: "AspectRatio", status: "New" },
  { name: "Avatar", status: "Updated" },
  { name: "Breadcrumb", status: "New" },
  { name: "Calendar", status: "Updated" },
  { name: "Collapsible", status: "New" },
  { name: "Command", status: "Updated" },
  { name: "ContextMenu", status: "Deprecated" },
  { name: "Drawer", status: "New" },
  { name: "HoverCard", status: "Updated" },
  { name: "InputOTP", status: "New" },
  { name: "Menubar", status: "Deprecated" },
  { name: "Pagination", status: "New" },
  { name: "Popover", status: "Updated" },
  { name: "Resizable", status: "New" },
  { name: "ScrollArea", status: "Updated" },
  { name: "Sheet", status: "New" },
  { name: "Sidebar", status: "Updated" },
  { name: "Skeleton", status: "New" },
  { name: "Slider", status: "Updated" },
  { name: "Spinner", status: "New" },
  { name: "Switch", status: "Updated" },
  { name: "Table", status: "Updated" },
  { name: "Tabs", status: "New" },
  { name: "Toggle", status: "Deprecated" },
  { name: "Tooltip", status: "Updated" },
]

export function ReleaseBadges() {
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-lg font-semibold text-foreground">Component Releases</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3">
          {releases.map((item) => {
            const variantClass =
              item.status === "New"
                ? "border-chart-2 text-chart-2"
                : item.status === "Updated"
                ? "border-chart-1 text-chart-1"
                : "border-chart-3 text-chart-3"

            return (
              <div
                key={item.name}
                className="flex items-center justify-between rounded-lg border border-border p-3"
              >
                <span className="text-sm font-medium text-foreground">{item.name}</span>
                <Badge variant="outline" className={variantClass}>
                  {item.status}
                </Badge>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
