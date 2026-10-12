import { Button } from "@openstatus/ui/components/ui/button";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@openstatus/ui/components/ui/card";

import { StatusBadge } from "../common/status-badge";

export type MonitorStatus = "up" | "degraded" | "down";

const statusConfig = {
  up: { label: "Up", variant: "success" },
  degraded: { label: "Degraded", variant: "warning" },
  down: { label: "Down", variant: "destructive" },
} as const satisfies Record<
  MonitorStatus,
  { label: string; variant: "success" | "warning" | "destructive" }
>;

export interface MonitorStatusCardProps {
  name: string;
  url: string;
  status: MonitorStatus;
  lastCheckedAt: Date | string;
  onPause?: () => void;
}

export function MonitorStatusCard({
  name,
  url,
  status,
  lastCheckedAt,
  onPause,
}: MonitorStatusCardProps) {
  const checkedAt =
    typeof lastCheckedAt === "string" ? new Date(lastCheckedAt) : lastCheckedAt;
  const config = statusConfig[status];

  return (
    <Card>
      <CardHeader>
        <CardTitle>{name}</CardTitle>
        <CardDescription className="truncate font-mono">{url}</CardDescription>
        <CardAction>
          <Button variant="outline" size="sm" onClick={onPause}>
            Pause
          </Button>
        </CardAction>
      </CardHeader>
      <CardContent className="flex items-center justify-between gap-4">
        <StatusBadge variant={config.variant}>
          {config.label}
        </StatusBadge>
        <time
          dateTime={checkedAt.toISOString()}
          className="text-muted-foreground text-sm"
        >
          Last checked {checkedAt.toLocaleString()}
        </time>
      </CardContent>
    </Card>
  );
}
