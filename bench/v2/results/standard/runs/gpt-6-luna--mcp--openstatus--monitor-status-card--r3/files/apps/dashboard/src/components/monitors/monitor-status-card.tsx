import { formatDistanceToNowStrict } from "date-fns";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@openstatus/ui/components/ui/card";
import { Button } from "@openstatus/ui/components/ui/button";

import { StatusBadge } from "@/components/common/status-badge";

type MonitorStatus = "up" | "down" | "degraded";

export type MonitorStatusCardProps = {
  name: string;
  url: string;
  status: MonitorStatus;
  lastChecked: Date | string;
  onPause?: () => void;
};

const statusDetails: Record<MonitorStatus, { label: string; variant: "success" | "destructive" | "warning" }> = {
  up: { label: "Up", variant: "success" },
  down: { label: "Down", variant: "destructive" },
  degraded: { label: "Degraded", variant: "warning" },
};

export function MonitorStatusCard({
  name,
  url,
  status,
  lastChecked,
  onPause,
}: MonitorStatusCardProps) {
  const checkedAt = new Date(lastChecked);
  const { label, variant } = statusDetails[status];

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between gap-4">
        <div className="min-w-0 space-y-1">
          <CardTitle className="truncate">{name}</CardTitle>
          <CardDescription className="truncate font-mono">{url}</CardDescription>
        </div>
        <Button type="button" variant="outline" size="sm" onClick={onPause}>
          Pause
        </Button>
      </CardHeader>
      <CardContent className="flex flex-wrap items-center justify-between gap-3">
        <StatusBadge variant={variant}>{label}</StatusBadge>
        <p className="text-sm text-muted-foreground">
          Last checked{" "}
          <time dateTime={checkedAt.toISOString()}>
            {formatDistanceToNowStrict(checkedAt, { addSuffix: true })}
          </time>
        </p>
      </CardContent>
    </Card>
  );
}
