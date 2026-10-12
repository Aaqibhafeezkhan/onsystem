"use client";

import { Badge } from "@openstatus/ui/components/ui/badge";
import { Button } from "@openstatus/ui/components/ui/button";
import {
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@openstatus/ui/components/ui/card";

export interface MonitorStatusCardProps {
  name: string;
  url: string;
  status: "up" | "down" | "degraded";
  lastCheckedAt: Date | string | number | null;
  onPause: () => void;
  pauseDisabled?: boolean;
}

const statusLabels = {
  up: "Up",
  down: "Down",
  degraded: "Degraded",
};

const statusClasses = {
  up: "border-success/30 bg-success/10 text-success",
  down: "border-destructive/30 bg-destructive/10 text-destructive",
  degraded: "border-warning/30 bg-warning/10 text-warning",
};

export function MonitorStatusCard({
  name,
  url,
  status,
  lastCheckedAt,
  onPause,
  pauseDisabled = false,
}: MonitorStatusCardProps) {
  const lastCheck =
    lastCheckedAt === null ? null : new Date(lastCheckedAt);
  const lastCheckIso =
    lastCheck && !Number.isNaN(lastCheck.getTime())
      ? lastCheck.toISOString()
      : null;

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <CardTitle className="min-w-0 break-words">{name}</CardTitle>
          <Badge variant="outline" className={statusClasses[status]}>
            {statusLabels[status]}
          </Badge>
        </div>
        <CardDescription className="break-all">{url}</CardDescription>
      </CardHeader>
      <CardFooter className="flex flex-wrap items-center justify-between gap-4">
        <p className="text-sm text-muted-foreground">
          Last check: {lastCheckIso ? (
            <time dateTime={lastCheckIso}>
              {lastCheckIso.slice(0, 19).replace("T", " ")} UTC
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
