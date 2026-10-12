import { Badge } from "@/registry/new-york-v4/ui/badge"

export function ReleaseBadges() {
  const components = [
    { name: "Accordion", status: "New" },
    { name: "Alert", status: "Updated" },
    { name: "Avatar", status: "Deprecated" },
    { name: "Button", status: "New" },
    { name: "Card", status: "Updated" },
    { name: "Dialog", status: "Deprecated" },
  ] as const

  return (
    <div className="flex flex-col gap-3">
      <div className="text-sm font-semibold text-foreground">Component Releases</div>
      <div className="flex flex-col gap-2">
        {components.map((component) => (
          <div
            key={component.name}
            className="flex items-center justify-between rounded-lg border p-3"
          >
            <span className="text-sm font-medium text-foreground">
              {component.name}
            </span>
            <Badge
              variant="outline"
              className={
                component.status === "New"
                  ? "border-chart-1 text-chart-1"
                  : component.status === "Updated"
                  ? "border-chart-2 text-chart-2"
                  : "border-chart-3 text-chart-3"
              }
            >
              {component.status}
            </Badge>
          </div>
        ))}
      </div>
    </div>
  )
}
