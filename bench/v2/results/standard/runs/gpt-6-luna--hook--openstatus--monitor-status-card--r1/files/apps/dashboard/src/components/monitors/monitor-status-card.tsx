import { Button } from "@openstatus/ui/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@openstatus/ui/components/ui/card";
import { formatDistanceToNow } from "date-fns";

import { StatusBadge } from "@/components/common/status-badge";

type MonitorStatus = "up" | "down" | "degraded";

type MonitorStatusCardProps = {
  name: string;
  url: string;
  status: MonitorStatus;
  lastChecked: Date | string | number | null;
  onPause?: () => void;
};

const statusDetails = {
  up: { label: "Up", variant: "success" },
  down: { label: "Down", variant: "destructive" },
  degraded: { label: "Degraded", variant: "warning" },
} as const;

function getLastCheckedDate(value: Date | string | number | null) {
  if (value === null) return null;
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function MonitorStatusCard({
  name,
  url,
  status,
  lastChecked,
  onPause,
}: MonitorStatusCardProps) {
  const date = getLastCheckedDate(lastChecked);
  const { label, variant } = statusDetails[status];

  return (
    <Card className="gap-4 shadow-none">
      <CardHeader className="flex-row items-start justify-between gap-4">
        <div className="min-w-0 space-y-1">
          <CardTitle className="truncate text-base">{name}</CardTitle>
          <a
            href={url}
            target="_blank"
            rel="noreferrer"
            className="block truncate text-sm text-muted-foreground underline-offset-4 hover:underline"
          >
            {url}
          </a>
        </div>
        <StatusBadge variant={variant} className="shrink-0">
          {label}
        </StatusBadge>
      </CardHeader>
      <CardContent className="flex items-center justify-between gap-4">
        <p className="min-w-0 text-sm text-muted-foreground">
          <span className="mr-1">Last checked</span>
          {date ? (
            <time dateTime={date.toISOString()}>
              {formatDistanceToNow(date, { addSuffix: true })}
            </time>
          ) : (
            <span>Not checked yet</span>
          )}
        </p>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="shrink-0"
          onClick={onPause}
        >
          Pause
        </Button>
      </CardContent>
    </Card>
  );
}
