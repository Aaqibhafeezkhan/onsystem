import { Button } from "@openstatus/ui/components/ui/button";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@openstatus/ui/components/ui/card";
import { formatDistanceToNowStrict } from "date-fns";

import { StatusBadge } from "@/components/common/status-badge";

export type MonitorStatus = "up" | "degraded" | "down";

const statusConfig: Record<
  MonitorStatus,
  { label: string; variant: "success" | "warning" | "destructive" }
> = {
  up: { label: "Up", variant: "success" },
  degraded: { label: "Degraded", variant: "warning" },
  down: { label: "Down", variant: "destructive" },
};

export interface MonitorStatusCardProps {
  name: string;
  url: string;
  status: MonitorStatus;
  lastCheckedAt: Date;
  onPause?: () => void;
}

export function MonitorStatusCard({
  name,
  url,
  status,
  lastCheckedAt,
  onPause,
}: MonitorStatusCardProps) {
  const { label, variant } = statusConfig[status];

  return (
    <Card className="gap-4 py-4">
      <CardHeader>
        <CardTitle>{name}</CardTitle>
        <CardDescription className="truncate">{url}</CardDescription>
        <CardAction>
          <Button variant="outline" size="sm" onClick={onPause}>
            Pause
          </Button>
        </CardAction>
      </CardHeader>
      <CardContent className="flex items-center justify-between gap-2">
        <StatusBadge variant={variant} aria-label={`Status: ${label}`}>
          {label}
        </StatusBadge>
        <time
          dateTime={lastCheckedAt.toISOString()}
          className="text-muted-foreground text-sm"
        >
          Last checked {formatDistanceToNowStrict(lastCheckedAt, { addSuffix: true })}
        </time>
      </CardContent>
    </Card>
  );
}
