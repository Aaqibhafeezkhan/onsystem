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

export type MonitorStatusCardProps = {
  name: string;
  url: string;
  status: "up" | "down" | "degraded";
  lastCheckedAt: Date | string | number | null;
  onPause?: () => void;
  pauseDisabled?: boolean;
  className?: string;
};

const statuses = {
  up: { label: "Up", variant: "success" },
  down: { label: "Down", variant: "destructive" },
  degraded: { label: "Degraded", variant: "warning" },
} as const;

export function MonitorStatusCard({
  name,
  url,
  status,
  lastCheckedAt,
  onPause,
  pauseDisabled = false,
  className,
}: MonitorStatusCardProps) {
  const { label, variant } = statuses[status];
  const date =
    lastCheckedAt === null
      ? null
      : lastCheckedAt instanceof Date
        ? lastCheckedAt
        : new Date(lastCheckedAt);
  const timestamp =
    date && !Number.isNaN(date.getTime()) ? date.toISOString() : null;

  return (
    <Card className={cn("gap-4 py-4 shadow-none", className)}>
      <CardHeader className="px-4">
        <CardTitle className="min-w-0">
          <h3 className="break-words text-sm font-semibold">{name}</h3>
        </CardTitle>
        <CardDescription className="break-all">{url}</CardDescription>
        <CardAction>
          <StatusBadge variant={variant}>{label}</StatusBadge>
        </CardAction>
      </CardHeader>
      <CardFooter className="flex-wrap justify-between gap-3 px-4">
        <p className="text-muted-foreground text-xs">
          Last check: {timestamp ? (
            <time dateTime={timestamp}>
              {timestamp.slice(0, 10)} {timestamp.slice(11, 19)} UTC
            </time>
          ) : (
            "Not checked yet"
          )}
        </p>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={onPause}
          disabled={pauseDisabled || !onPause}
          aria-label={`Pause ${name}`}
        >
          Pause
        </Button>
      </CardFooter>
    </Card>
  );
}
