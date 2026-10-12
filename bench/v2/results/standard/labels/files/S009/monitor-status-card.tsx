import { Button } from "@openstatus/ui/components/ui/button";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@openstatus/ui/components/ui/card";
import type React from "react";
import { StatusBadge } from "../common/status-badge";
import type { StatusVariant } from "../common/status-dot";

type MonitorStatus = "up" | "down" | "degraded";

const STATUS: Record<MonitorStatus, { label: string; variant: StatusVariant }> =
  {
    up: { label: "Up", variant: "success" },
    down: { label: "Down", variant: "destructive" },
    degraded: { label: "Degraded", variant: "warning" },
  };

export function MonitorStatusCard({
  name,
  url,
  status,
  lastCheckedAt,
  onPause,
  ...props
}: Omit<React.ComponentProps<typeof Card>, "children"> & {
  name: string;
  url: string;
  status: MonitorStatus;
  lastCheckedAt: Date;
  onPause?: () => void;
}) {
  const { label, variant } = STATUS[status];

  return (
    <Card {...props}>
      <CardHeader>
        <CardTitle>{name}</CardTitle>
        <CardDescription className="truncate font-mono">{url}</CardDescription>
        <CardAction>
          <StatusBadge variant={variant}>{label}</StatusBadge>
        </CardAction>
      </CardHeader>
      <CardContent className="flex items-center justify-between gap-2">
        <p className="text-muted-foreground text-sm">
          Last checked{" "}
          <time dateTime={lastCheckedAt.toISOString()}>
            {lastCheckedAt.toLocaleString()}
          </time>
        </p>
        <Button variant="outline" size="sm" onClick={onPause}>
          Pause
        </Button>
      </CardContent>
    </Card>
  );
}
