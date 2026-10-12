import { StatusBadge } from "@/components/common/status-badge";
import type { StatusVariant } from "@/components/common/status-dot";
import { formatDateTime } from "@/lib/formatter";
import { Button } from "@openstatus/ui/components/ui/button";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@openstatus/ui/components/ui/card";

export type MonitorStatus = "up" | "down" | "degraded";

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
}: {
  name: string;
  url: string;
  status: MonitorStatus;
  lastCheckedAt: Date;
  onPause?: () => void;
}) {
  const { label, variant } = STATUS[status];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="truncate">{name}</CardTitle>
        <CardDescription className="truncate font-mono">{url}</CardDescription>
        <CardAction>
          <StatusBadge variant={variant}>{label}</StatusBadge>
        </CardAction>
      </CardHeader>
      <CardContent className="flex items-center justify-between gap-2">
        <p className="text-muted-foreground text-sm">
          Last checked{" "}
          <time dateTime={lastCheckedAt.toISOString()}>
            {formatDateTime(lastCheckedAt)}
          </time>
        </p>
        <Button type="button" variant="outline" size="sm" onClick={onPause}>
          Pause
        </Button>
      </CardContent>
    </Card>
  );
}
