import { Button } from "@openstatus/ui/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@openstatus/ui/components/ui/card";
import { StatusBadge } from "@/components/common/status-badge";
import { formatDistanceToNowStrict } from "date-fns";

type MonitorStatus = "up" | "down" | "degraded" | "active" | "error";

interface MonitorStatusCardProps {
  name: string;
  url: string;
  status: MonitorStatus;
  /** The timestamp of the most recent check. */
  lastCheckedAt?: Date | string | null;
  /** Alias for `lastCheckedAt`. */
  lastChecked?: Date | string | null;
  onPause?: () => void;
}

const statusDetails: Record<MonitorStatus, { label: string; variant: "success" | "destructive" | "warning" }> = {
  up: { label: "Up", variant: "success" },
  active: { label: "Up", variant: "success" },
  down: { label: "Down", variant: "destructive" },
  error: { label: "Down", variant: "destructive" },
  degraded: { label: "Degraded", variant: "warning" },
};

export function MonitorStatusCard({
  name,
  url,
  status,
  lastCheckedAt,
  lastChecked,
  onPause,
}: MonitorStatusCardProps) {
  const checkedAt = lastCheckedAt ?? lastChecked;
  const date = checkedAt ? new Date(checkedAt) : null;
  const lastCheckedLabel = date && !Number.isNaN(date.getTime())
    ? formatDistanceToNowStrict(date, { addSuffix: true })
    : "Never";
  const statusInfo = statusDetails[status];

  return (
    <Card className="gap-4 py-4 shadow-none">
      <CardHeader className="flex-row items-start justify-between gap-4 px-4">
        <div className="min-w-0 space-y-1">
          <CardTitle className="truncate text-base">{name}</CardTitle>
          <a
            href={url}
            target="_blank"
            rel="noreferrer"
            className="block truncate text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
          >
            {url}
          </a>
        </div>
        <StatusBadge variant={statusInfo.variant} className="shrink-0">
          {statusInfo.label}
        </StatusBadge>
      </CardHeader>
      <CardContent className="flex items-center justify-between gap-4 px-4">
        <p className="text-sm text-muted-foreground">
          Last checked{" "}
          <time dateTime={date && !Number.isNaN(date.getTime()) ? date.toISOString() : undefined}>
            {lastCheckedLabel}
          </time>
        </p>
        <Button type="button" variant="outline" size="sm" onClick={onPause}>
          Pause
        </Button>
      </CardContent>
    </Card>
  );
}
