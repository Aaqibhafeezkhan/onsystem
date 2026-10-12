"use client";

import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@openstatus/ui/components/ui/card";
import { Button } from "@openstatus/ui/components/ui/button";
import { formatDistanceToNowStrict } from "date-fns";

import { StatusBadge } from "../common/status-badge";

export type MonitorStatus = "up" | "degraded" | "down";

const statusConfig = {
  up: { label: "Up", variant: "success" },
  degraded: { label: "Degraded", variant: "warning" },
  down: { label: "Down", variant: "destructive" },
} as const satisfies Record<
  MonitorStatus,
  {
    label: string;
    variant: "success" | "warning" | "destructive";
  }
>;

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
        <CardDescription className="font-mono break-all">{url}</CardDescription>
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
            {formatDistanceToNowStrict(lastCheckedAt, { addSuffix: true })}
          </time>
        </p>
      </CardContent>
    </Card>
  );
}
