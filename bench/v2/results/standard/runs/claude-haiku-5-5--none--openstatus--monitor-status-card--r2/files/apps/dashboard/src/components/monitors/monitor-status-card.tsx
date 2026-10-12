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
import { formatDistanceToNowStrict } from "date-fns";

import { StatusBadge } from "../common/status-badge";
import type { StatusVariant } from "../common/status-dot";

export type MonitorStatus = "up" | "degraded" | "down";

const STATUS_CONFIG: Record<
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
  lastCheckedAt: Date;
  onPause?: () => void;
}

export function MonitorStatusCard({
  name,
  url,
  status,
  lastCheckedAt,
  onPause,
}: MonitorStatusCardProps) {
  const { label, variant } = STATUS_CONFIG[status];

  return (
    <Card className="gap-4 py-4 shadow-none">
      <CardHeader className="px-4">
        <CardTitle className="truncate text-sm">{name}</CardTitle>
        <CardDescription className="truncate font-mono text-xs">
          {url}
        </CardDescription>
        <CardAction>
          <StatusBadge dot variant={variant} aria-label={`Status: ${label}`}>
            {label}
          </StatusBadge>
        </CardAction>
      </CardHeader>
      <CardContent className="flex items-center justify-between gap-2 px-4">
        <p className="text-muted-foreground text-xs">
          Last checked{" "}
          <time dateTime={lastCheckedAt.toISOString()}>
            {formatDistanceToNowStrict(lastCheckedAt, { addSuffix: true })}
          </time>
        </p>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={onPause}
          disabled={!onPause}
        >
          Pause
        </Button>
      </CardContent>
    </Card>
  );
}
