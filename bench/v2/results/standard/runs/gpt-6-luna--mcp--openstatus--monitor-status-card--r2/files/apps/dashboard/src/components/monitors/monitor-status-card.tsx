import { Badge } from "@openstatus/ui/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@openstatus/ui/components/ui/card";
import { Button } from "@openstatus/ui/components/ui/button";

import { formatDistanceToNowShort } from "@/lib/formatter";

export type MonitorStatus = "up" | "down" | "degraded";

export interface MonitorStatusCardProps {
  name: string;
  url: string;
  status: MonitorStatus;
  lastChecked: Date | string;
  onPause?: () => void;
}

const statusPresentation: Record<
  MonitorStatus,
  { label: string; className: string }
> = {
  up: { label: "Up", className: "border-transparent bg-success/10 text-success" },
  down: {
    label: "Down",
    className: "border-transparent bg-destructive/10 text-destructive",
  },
  degraded: {
    label: "Degraded",
    className: "border-transparent bg-warning/10 text-warning",
  },
};

function formatLastChecked(value: Date | string) {
  if (value instanceof Date) return formatDistanceToNowShort(value);

  const parsedDate = new Date(value);
  return Number.isNaN(parsedDate.getTime())
    ? value
    : formatDistanceToNowShort(parsedDate);
}

function getDateTime(value: Date | string) {
  const parsedDate = value instanceof Date ? value : new Date(value);
  return Number.isNaN(parsedDate.getTime()) ? undefined : parsedDate.toISOString();
}

export function MonitorStatusCard({
  name,
  url,
  status,
  lastChecked,
  onPause,
}: MonitorStatusCardProps) {
  const presentation = statusPresentation[status];

  return (
    <Card className="gap-4">
      <CardHeader className="flex-row items-start justify-between gap-4">
        <div className="min-w-0 space-y-1">
          <CardTitle className="truncate text-base">{name}</CardTitle>
          <a
            className="block truncate text-sm text-muted-foreground underline-offset-4 hover:underline"
            href={url}
          >
            {url}
          </a>
        </div>
        <Badge variant="outline" className={presentation.className}>
          {presentation.label}
        </Badge>
      </CardHeader>
      <CardContent className="flex items-center justify-between gap-4">
        <div className="space-y-1">
          <p className="text-xs text-muted-foreground">Last checked</p>
          <time className="text-sm" dateTime={getDateTime(lastChecked)}>
            {formatLastChecked(lastChecked)}
          </time>
        </div>
        <Button type="button" variant="outline" size="sm" onClick={onPause}>
          Pause
        </Button>
      </CardContent>
    </Card>
  );
}
