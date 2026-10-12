import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@openstatus/ui/components/ui/card";
import { Button } from "@openstatus/ui/components/ui/button";
import { formatDistanceToNow } from "date-fns";

import { StatusBadge } from "@/components/common/status-badge";
import type { StatusVariant } from "@/components/common/status-dot";

export type MonitorStatus = "up" | "down" | "degraded";

const statusConfig: Record<
  MonitorStatus,
  { label: string; variant: StatusVariant }
> = {
  up: { label: "Up", variant: "success" },
  down: { label: "Down", variant: "destructive" },
  degraded: { label: "Degraded", variant: "warning" },
};

export interface MonitorStatusCardProps {
  name: string;
  url: string;
  status: MonitorStatus;
  /** Time of the last check. `null` when the monitor has never been checked. */
  lastCheckedAt: Date | string | number | null;
  onPause?: () => void;
  isPausing?: boolean;
}

export function MonitorStatusCard({
  name,
  url,
  status,
  lastCheckedAt,
  onPause,
  isPausing = false,
}: MonitorStatusCardProps) {
  const { label, variant } = statusConfig[status];

  const lastCheckedDate =
    lastCheckedAt === null ? null : new Date(lastCheckedAt);
  const hasValidDate =
    lastCheckedDate !== null && !Number.isNaN(lastCheckedDate.getTime());

  return (
    <Card className="gap-4 py-4 shadow-none">
      <CardHeader className="flex flex-row items-start justify-between gap-2 px-4">
        <div className="flex min-w-0 flex-col gap-1">
          <CardTitle className="truncate">{name}</CardTitle>
          <CardDescription className="truncate font-mono text-xs">
            {url}
          </CardDescription>
        </div>
        <StatusBadge variant={variant} dot className="shrink-0">
          {label}
        </StatusBadge>
      </CardHeader>

      <CardContent className="px-4 text-sm">
        <p className="text-muted-foreground">
          Last checked{" "}
          {hasValidDate && lastCheckedDate ? (
            <time
              dateTime={lastCheckedDate.toISOString()}
              className="text-foreground"
            >
              {formatDistanceToNow(lastCheckedDate, { addSuffix: true })}
            </time>
          ) : (
            <span className="text-foreground">never</span>
          )}
        </p>
      </CardContent>

      <CardFooter className="border-t px-4 pt-4 pb-0">
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="ml-auto"
          onClick={onPause}
          disabled={!onPause || isPausing}
        >
          Pause
        </Button>
      </CardFooter>
    </Card>
  );
}
