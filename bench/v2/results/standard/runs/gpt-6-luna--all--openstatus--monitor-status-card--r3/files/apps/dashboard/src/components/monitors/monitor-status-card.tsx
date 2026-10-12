import { Badge } from "@openstatus/ui/components/ui/badge";
import { Button } from "@openstatus/ui/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@openstatus/ui/components/ui/card";
import { cn } from "@openstatus/ui/lib/utils";
import type { ComponentProps } from "react";

export type MonitorStatus = "up" | "down" | "degraded";

export interface MonitorStatusCardProps extends ComponentProps<typeof Card> {
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
  up: {
    label: "Up",
    className: "border-success/20 bg-success/10 text-success",
  },
  down: {
    label: "Down",
    className: "border-destructive/20 bg-destructive/10 text-destructive",
  },
  degraded: {
    label: "Degraded",
    className: "border-warning/20 bg-warning/10 text-warning",
  },
};

export function MonitorStatusCard({
  name,
  url,
  status,
  lastChecked,
  onPause,
  className,
  ...cardProps
}: MonitorStatusCardProps) {
  const checkedAt = lastChecked instanceof Date
    ? lastChecked
    : new Date(lastChecked);
  const statusDetails = statusPresentation[status];

  return (
    <Card className={cn("gap-4", className)} {...cardProps}>
      <CardHeader className="flex-row items-start justify-between gap-4">
        <div className="min-w-0 space-y-1">
          <CardTitle className="truncate text-base font-semibold">
            {name}
          </CardTitle>
          <a
            className="block truncate text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
            href={url}
            target="_blank"
            rel="noreferrer"
          >
            {url}
          </a>
        </div>
        <Badge
          variant="outline"
          className={cn("shrink-0", statusDetails.className)}
        >
          {statusDetails.label}
        </Badge>
      </CardHeader>
      <CardContent className="flex items-center justify-between gap-4">
        <div className="min-w-0 space-y-1">
          <p className="text-sm text-muted-foreground">Last checked</p>
          <time
            className="text-sm font-medium"
            dateTime={checkedAt.toISOString()}
          >
            {new Intl.DateTimeFormat(undefined, {
              dateStyle: "medium",
              timeStyle: "short",
            }).format(checkedAt)}
          </time>
        </div>
        <Button type="button" variant="outline" size="sm" onClick={onPause}>
          Pause
        </Button>
      </CardContent>
    </Card>
  );
}
