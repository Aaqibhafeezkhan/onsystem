"use client";

import { Button } from "@openstatus/ui/components/ui/button";
import {
  Card,
  CardAction,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@openstatus/ui/components/ui/card";
import { cn } from "@openstatus/ui/lib/utils";

import { StatusBadge } from "@/components/common/status-badge";

export interface MonitorStatusCardProps {
  name: string;
  url: string;
  status: "up" | "down" | "degraded";
  lastCheckedAt: Date | string | number | null;
  onPause: () => void;
  pauseDisabled?: boolean;
  className?: string;
}

const statuses = {
  up: { label: "Up", variant: "success" },
  down: { label: "Down", variant: "destructive" },
  degraded: { label: "Degraded", variant: "warning" },
} as const;

const dateFormatter = new Intl.DateTimeFormat("en-US", {
  dateStyle: "medium",
  timeStyle: "medium",
  timeZone: "UTC",
});

export function MonitorStatusCard({
  name,
  url,
  status,
  lastCheckedAt,
  onPause,
  pauseDisabled = false,
  className,
}: MonitorStatusCardProps) {
  const checkDate =
    lastCheckedAt === null ? null : new Date(lastCheckedAt);
  const validCheckDate =
    checkDate !== null && !Number.isNaN(checkDate.getTime())
      ? checkDate
      : null;
  const { label, variant } = statuses[status];

  return (
    <Card className={cn("gap-4 py-4 shadow-none", className)}>
      <CardHeader className="min-w-0 px-4">
        <CardTitle className="min-w-0 break-words leading-snug">
          {name}
        </CardTitle>
        <CardDescription className="min-w-0 break-all font-mono text-xs">
          {url}
        </CardDescription>
        <CardAction>
          <StatusBadge variant={variant}>{label}</StatusBadge>
        </CardAction>
      </CardHeader>
      <CardFooter className="flex-wrap justify-between gap-3 px-4">
        <div className="text-muted-foreground text-xs">
          <span>Last check: </span>
          {validCheckDate ? (
            <time dateTime={validCheckDate.toISOString()}>
              {dateFormatter.format(validCheckDate)} UTC
            </time>
          ) : (
            <span>No checks yet</span>
          )}
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={onPause}
          disabled={pauseDisabled}
          aria-label={`Pause ${name}`}
        >
          Pause
        </Button>
      </CardFooter>
    </Card>
  );
}
