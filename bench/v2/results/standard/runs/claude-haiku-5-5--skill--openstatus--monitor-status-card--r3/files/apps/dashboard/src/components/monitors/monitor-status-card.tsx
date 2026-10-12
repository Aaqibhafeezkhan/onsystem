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

import { StatusBadge } from "@/components/common/status-badge";
import type { StatusVariant } from "@/components/common/status-dot";
import { formatDateTime } from "@/lib/formatter";

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
  const { label, variant } = statusConfig[status];

  return (
    <Card>
      <CardHeader>
        <CardTitle>{name}</CardTitle>
        <CardDescription className="truncate font-mono">{url}</CardDescription>
        <CardAction>
          <Button variant="outline" size="sm" onClick={onPause}>
            Pause
          </Button>
        </CardAction>
      </CardHeader>
      <CardContent className="flex items-center justify-between gap-4">
        <StatusBadge variant={variant}>{label}</StatusBadge>
        <p className="text-muted-foreground text-sm">
          Last checked{" "}
          <time dateTime={lastCheckedAt.toISOString()}>
            {formatDateTime(lastCheckedAt)}
          </time>
        </p>
      </CardContent>
    </Card>
  );
}
