"use client";

import { Button } from "@openstatus/ui/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@openstatus/ui/components/ui/card";

import { StatusBadge } from "@/components/common/status-badge";
import { formatDistanceToNowShort } from "@/lib/formatter";

export type MonitorStatus = "up" | "down" | "degraded" | "active" | "error";

export type MonitorStatusCardProps = {
  name: string;
  url: string;
  status: MonitorStatus;
  lastCheckedAt: Date | string | number | null;
  onPause?: () => void;
};

const statusDisplay = {
  up: { label: "Up", variant: "success" },
  active: { label: "Up", variant: "success" },
  down: { label: "Down", variant: "destructive" },
  error: { label: "Down", variant: "destructive" },
  degraded: { label: "Degraded", variant: "warning" },
} as const;

function formatLastChecked(value: MonitorStatusCardProps["lastCheckedAt"]) {
  if (value === null) return "Never";

  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "—";

  return formatDistanceToNowShort(date);
}

export function MonitorStatusCard({
  name,
  url,
  status,
  lastCheckedAt,
  onPause,
}: MonitorStatusCardProps) {
  const display = statusDisplay[status];

  return (
    <Card className="gap-0 shadow-none">
      <CardHeader className="flex flex-row items-start justify-between gap-4">
        <div className="min-w-0 space-y-1">
          <CardTitle className="truncate text-base">{name}</CardTitle>
          <a
            href={url}
            className="block truncate text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
          >
            {url}
          </a>
        </div>
        <StatusBadge variant={display.variant} className="shrink-0">
          {display.label}
        </StatusBadge>
      </CardHeader>
      <CardContent className="pt-4">
        <p className="text-sm text-muted-foreground">
          Last checked <span className="text-foreground">{formatLastChecked(lastCheckedAt)}</span>
        </p>
      </CardContent>
      <CardFooter className="justify-end border-t pt-4">
        <Button variant="outline" size="sm" onClick={onPause}>
          Pause
        </Button>
      </CardFooter>
    </Card>
  );
}
