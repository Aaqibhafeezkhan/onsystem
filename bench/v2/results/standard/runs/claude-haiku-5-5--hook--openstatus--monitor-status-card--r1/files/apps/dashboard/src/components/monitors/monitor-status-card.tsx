"use client";

import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@openstatus/ui/components/ui/card";
import { Button } from "@openstatus/ui/components/ui/button";

import { StatusBadge } from "@/components/common/status-badge";
import type { StatusVariant } from "@/components/common/status-dot";
import { formatDistanceToNowShort } from "@/lib/formatter";

export type MonitorStatus = "up" | "down" | "degraded";

const statusConfig: Record<
  MonitorStatus,
  { label: string; variant: StatusVariant }
> = {
  up: { label: "Up", variant: "success" },
  degraded: { label: "Degraded", variant: "warning" },
  down: { label: "Down", variant: "destructive" },
};

interface MonitorStatusCardProps {
  name: string;
  url: string;
  status: MonitorStatus;
  /** Time of the last check. `null` when the monitor has not been checked yet. */
  lastCheckedAt: Date | null;
  onPause?: () => void;
}

export function MonitorStatusCard({
  name,
  url,
  status,
  lastCheckedAt,
  onPause,
}: MonitorStatusCardProps) {
  const { label, variant } = statusConfig[status];

  return (
    <Card className="gap-4 py-4 shadow-none">
      <CardHeader className="flex flex-row items-start justify-between gap-4 px-4">
        <div className="flex min-w-0 flex-col gap-1">
          <CardTitle className="truncate text-sm font-medium">{name}</CardTitle>
          <p className="text-muted-foreground truncate font-mono text-xs">
            {url}
          </p>
        </div>
        <StatusBadge variant={variant} dot aria-label={`Status: ${label}`}>
          {label}
        </StatusBadge>
      </CardHeader>
      <CardContent className="px-4">
        <p className="text-muted-foreground text-xs">
          Last checked{" "}
          {lastCheckedAt ? (
            <time dateTime={lastCheckedAt.toISOString()}>
              {formatDistanceToNowShort(lastCheckedAt)}
            </time>
          ) : (
            "never"
          )}
        </p>
      </CardContent>
      <CardFooter className="px-4">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={onPause}
          className="ml-auto"
        >
          Pause
        </Button>
      </CardFooter>
    </Card>
  );
}
