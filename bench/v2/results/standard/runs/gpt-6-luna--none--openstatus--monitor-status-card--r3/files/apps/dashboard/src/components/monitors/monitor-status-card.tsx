import { formatDistanceToNowStrict } from "date-fns";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@openstatus/ui/components/ui/card";
import { Button } from "@openstatus/ui/components/ui/button";

import { StatusBadge } from "@/components/common/status-badge";

type MonitorStatus = "up" | "down" | "degraded";

type MonitorStatusCardProps = {
  name: string;
  url: string;
  status: MonitorStatus;
  lastChecked: Date | string;
  onPause?: () => void;
};

const statusPresentation = {
  up: { label: "Up", variant: "success" },
  down: { label: "Down", variant: "destructive" },
  degraded: { label: "Degraded", variant: "warning" },
} as const;

export function MonitorStatusCard({
  name,
  url,
  status,
  lastChecked,
  onPause,
}: MonitorStatusCardProps) {
  const presentation = statusPresentation[status];
  const checkedAt =
    lastChecked instanceof Date
      ? formatDistanceToNowStrict(lastChecked, { addSuffix: true })
      : lastChecked;

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
        <StatusBadge variant={presentation.variant} dot>
          {presentation.label}
        </StatusBadge>
      </CardHeader>
      <CardContent className="flex items-center justify-between gap-4 text-sm">
        <span className="text-muted-foreground">Last checked</span>
        <time
          dateTime={lastChecked instanceof Date ? lastChecked.toISOString() : undefined}
          className="text-right"
        >
          {checkedAt}
        </time>
      </CardContent>
      <CardFooter className="justify-end">
        <Button type="button" variant="outline" size="sm" onClick={onPause}>
          Pause
        </Button>
      </CardFooter>
    </Card>
  );
}
