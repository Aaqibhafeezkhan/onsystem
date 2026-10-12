"use client";

import { Button } from "@openstatus/ui/components/ui/button";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@openstatus/ui/components/ui/card";
import { format, formatDistanceToNowStrict } from "date-fns";

import { StatusBadge } from "../common/status-badge";
import type { StatusVariant } from "../common/status-dot";

export type MonitorStatus = "up" | "down" | "degraded";

const statusConfig: Record<
  MonitorStatus,
  { label: string; variant: StatusVariant }
> = {
  up: { label: "Up", variant: "success" },
  down: { label: "Down", variant: "destructive" },
  degraded: { label: "Degraded", variant: "warning" },
};

interface MonitorStatusCardProps {
  name: string;
  url: string;
  status: MonitorStatus;
  /** Time of the last check, or null if the monitor has never been checked. */
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
      <CardHeader className="px-4">
        <CardTitle className="truncate">{name}</CardTitle>
        <CardDescription className="truncate font-mono">{url}</CardDescription>
        <CardAction>
          <StatusBadge variant={variant} dot>
            {label}
          </StatusBadge>
        </CardAction>
      </CardHeader>
      <CardContent className="flex items-center justify-between gap-4 px-4">
        <div className="text-muted-foreground flex flex-col text-xs">
          <span>Last checked</span>
          {lastCheckedAt ? (
            <time
              dateTime={lastCheckedAt.toISOString()}
              title={format(lastCheckedAt, "LLL dd, y HH:mm:ss")}
              className="text-foreground font-mono"
            >
              {formatDistanceToNowStrict(lastCheckedAt, { addSuffix: true })}
            </time>
          ) : (
            <span className="text-foreground font-mono">Never</span>
          )}
        </div>
        <Button type="button" variant="outline" size="sm" onClick={onPause}>
          Pause
        </Button>
      </CardContent>
    </Card>
  );
}
