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

import { StatusBadge } from "@/components/common/status-badge";

export type MonitorStatusCardProps = {
  name: string;
  url: string;
  status: "up" | "down" | "degraded";
  lastCheck: Date | string | number | null;
  onPause: () => void;
  pauseDisabled?: boolean;
};

const statuses = {
  up: { label: "Up", variant: "success" },
  down: { label: "Down", variant: "destructive" },
  degraded: { label: "Degraded", variant: "warning" },
} as const;

const lastCheckFormatter = new Intl.DateTimeFormat("en-US", {
  dateStyle: "medium",
  timeStyle: "long",
  timeZone: "UTC",
});

export function MonitorStatusCard({
  name,
  url,
  status,
  lastCheck,
  onPause,
  pauseDisabled = false,
}: MonitorStatusCardProps) {
  const checkDate = lastCheck === null ? null : new Date(lastCheck);
  const validCheckDate =
    checkDate && !Number.isNaN(checkDate.getTime()) ? checkDate : null;
  const currentStatus = statuses[status];

  return (
    <Card>
      <CardHeader className="min-w-0">
        <CardTitle className="break-words">{name}</CardTitle>
        <CardDescription className="break-all">{url}</CardDescription>
        <CardAction>
          <StatusBadge variant={currentStatus.variant}>
            {currentStatus.label}
          </StatusBadge>
        </CardAction>
      </CardHeader>
      <CardFooter className="flex-wrap justify-between gap-4">
        <p className="text-muted-foreground text-sm">
          Last check: {" "}
          {validCheckDate ? (
            <time dateTime={validCheckDate.toISOString()}>
              {lastCheckFormatter.format(validCheckDate)}
            </time>
          ) : (
            "Not available"
          )}
        </p>
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
