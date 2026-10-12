"use client"

import { Button } from "@openstatus/ui/components/ui/button"
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@openstatus/ui/components/ui/card"

export type MonitorStatus = "up" | "degraded" | "down"

const STATUS_STYLES: Record<
  MonitorStatus,
  { label: string; text: string; dot: string }
> = {
  up: { label: "Up", text: "text-success", dot: "bg-success" },
  degraded: { label: "Degraded", text: "text-warning", dot: "bg-warning" },
  down: { label: "Down", text: "text-error", dot: "bg-error" },
}

export interface MonitorStatusCardProps {
  name: string
  url: string
  status: MonitorStatus
  lastCheckedAt: Date | string
  onPause?: () => void
}

export function MonitorStatusCard({
  name,
  url,
  status,
  lastCheckedAt,
  onPause,
}: MonitorStatusCardProps) {
  const date =
    typeof lastCheckedAt === "string" ? new Date(lastCheckedAt) : lastCheckedAt
  const style = STATUS_STYLES[status]

  return (
    <Card>
      <CardHeader>
        <CardTitle>{name}</CardTitle>
        <CardDescription className="font-mono">{url}</CardDescription>
        <CardAction>
          <Button variant="outline" size="sm" onClick={onPause}>
            Pause
          </Button>
        </CardAction>
      </CardHeader>
      <CardContent className="flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <span
            aria-hidden="true"
            className={`size-2 rounded-full ${style.dot}`}
          />
          <span className={`font-medium ${style.text}`}>{style.label}</span>
        </div>
        <p className="text-muted-foreground text-sm">
          Last checked{" "}
          <time dateTime={date.toISOString()}>
            {new Intl.DateTimeFormat("en", {
              dateStyle: "medium",
              timeStyle: "short",
            }).format(date)}
          </time>
        </p>
      </CardContent>
    </Card>
  )
}
