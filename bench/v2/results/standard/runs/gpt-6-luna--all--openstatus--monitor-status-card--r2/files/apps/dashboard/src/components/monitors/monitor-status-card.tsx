import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@openstatus/ui/components/ui/card";
import { Button } from "@openstatus/ui/components/ui/button";

import { StatusBadge } from "../common/status-badge";

type MonitorStatus = "up" | "down" | "degraded";

type MonitorStatusCardProps = {
  name: string;
  url: string;
  status: MonitorStatus;
  lastCheckedAt: Date | string;
  onPause?: () => void;
};

const statusPresentation = {
  up: { label: "Up", variant: "success" as const },
  down: { label: "Down", variant: "destructive" as const },
  degraded: { label: "Degraded", variant: "warning" as const },
};

function formatLastCheckedAt(value: Date | string) {
  const date = value instanceof Date ? value : new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value.toString();
  }

  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

export function MonitorStatusCard({
  name,
  url,
  status,
  lastCheckedAt,
  onPause,
}: MonitorStatusCardProps) {
  const presentation = statusPresentation[status];
  const checkedAt = lastCheckedAt instanceof Date ? lastCheckedAt : new Date(lastCheckedAt);
  const dateTime = Number.isNaN(checkedAt.getTime())
    ? undefined
    : checkedAt.toISOString();

  return (
    <Card>
      <CardHeader className="flex-row items-start justify-between gap-4">
        <div className="min-w-0 space-y-1">
          <CardTitle className="truncate text-base">{name}</CardTitle>
          <p className="truncate font-mono text-sm text-muted-foreground">{url}</p>
        </div>
        <StatusBadge variant={presentation.variant}>{presentation.label}</StatusBadge>
      </CardHeader>
      <CardContent className="flex items-center justify-between gap-4">
        <div className="space-y-1">
          <p className="text-sm text-muted-foreground">Last checked</p>
          <time className="text-sm" dateTime={dateTime}>
            {formatLastCheckedAt(lastCheckedAt)}
          </time>
        </div>
        <Button variant="outline" size="sm" onClick={onPause}>
          Pause
        </Button>
      </CardContent>
    </Card>
  );
}
