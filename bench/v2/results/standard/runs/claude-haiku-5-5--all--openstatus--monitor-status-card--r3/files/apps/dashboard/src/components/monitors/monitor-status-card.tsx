import { Button } from "@openstatus/ui/components/ui/button";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@openstatus/ui/components/ui/card";

import { StatusBadge } from "@/components/common/status-badge";

export type MonitorStatus = "up" | "degraded" | "down";

const statusLabels: Record<MonitorStatus, string> = {
  up: "Up",
  degraded: "Degraded",
  down: "Down",
};

const statusVariants: Record<
  MonitorStatus,
  "success" | "warning" | "destructive"
> = {
  up: "success",
  degraded: "warning",
  down: "destructive",
};

export interface MonitorStatusCardProps {
  name: string;
  url: string;
  status: MonitorStatus;
  lastCheckedAt: Date;
  onPause?: () => void;
}

/** One uptime monitor: name, URL, status, last check time and a Pause action. */
export function MonitorStatusCard({
  name,
  url,
  status,
  lastCheckedAt,
  onPause,
}: MonitorStatusCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{name}</CardTitle>
        <CardDescription className="truncate font-mono">{url}</CardDescription>
        <CardAction>
          <StatusBadge variant={statusVariants[status]}>
            {statusLabels[status]}
          </StatusBadge>
        </CardAction>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground text-sm">
          Last checked{" "}
          <time dateTime={lastCheckedAt.toISOString()}>
            {lastCheckedAt.toLocaleString()}
          </time>
        </p>
      </CardContent>
      <CardFooter>
        <Button variant="outline" size="sm" onClick={onPause}>
          Pause
        </Button>
      </CardFooter>
    </Card>
  );
}
