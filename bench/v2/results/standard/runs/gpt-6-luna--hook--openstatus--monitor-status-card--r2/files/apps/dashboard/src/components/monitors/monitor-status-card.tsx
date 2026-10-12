import { Button } from "@openstatus/ui/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@openstatus/ui/components/ui/card";
import { StatusBadge } from "../common/status-badge";

type MonitorStatus = "up" | "down" | "degraded";

const statusDetails: Record<
  MonitorStatus,
  { label: string; variant: "success" | "destructive" | "warning" }
> = {
  up: { label: "Up", variant: "success" },
  down: { label: "Down", variant: "destructive" },
  degraded: { label: "Degraded", variant: "warning" },
};

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
    lastCheckedAt instanceof Date ? lastCheckedAt : new Date(lastCheckedAt);
  const isValidDate = !Number.isNaN(checkedAt.getTime());
  const formattedCheckedAt = isValidDate
    ? new Intl.DateTimeFormat(undefined, {
        dateStyle: "medium",
        timeStyle: "short",
      }).format(checkedAt)
    : "Unknown";
  const details = statusDetails[status];

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
        <StatusBadge variant={details.variant} className="shrink-0">
          {details.label}
        </StatusBadge>
      </CardHeader>
      <CardContent className="flex items-center justify-between gap-4 px-4">
        <div className="min-w-0">
          <p className="text-xs text-muted-foreground">Last checked</p>
          <time
            dateTime={isValidDate ? checkedAt.toISOString() : undefined}
            className="text-sm"
          >
            {formattedCheckedAt}
          </time>
        </div>
        <Button type="button" variant="outline" size="sm" onClick={onPause}>
          Pause
        </Button>
      </CardContent>
    </Card>
  );
}
