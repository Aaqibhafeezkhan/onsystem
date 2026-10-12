"use client";

import { Badge } from "@openstatus/ui/components/ui/badge";
import { Button } from "@openstatus/ui/components/ui/button";
import {
  Card,
  CardAction,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@openstatus/ui/components/ui/card";

export interface MonitorStatusCardProps {
  name: string;
  url: string;
  status: "up" | "down" | "degraded";
  lastCheck: Date | string | null;
  onPause: () => void;
  pauseDisabled?: boolean;
}

const statusLabels = {
  up: "Up",
  down: "Down",
  degraded: "Degraded",
} as const;

const statusClasses = {
  up: "border-success/20 bg-success/10 text-success",
  down: "border-destructive/20 bg-destructive/10 text-destructive",
  degraded: "border-warning/20 bg-warning/10 text-warning",
} as const;

export function MonitorStatusCard({
  name,
  url,
  status,
  lastCheck,
  onPause,
  pauseDisabled = false,
}: MonitorStatusCardProps) {
  const checkedAt = lastCheck === null ? null : new Date(lastCheck);
  const hasValidCheck = checkedAt !== null && !Number.isNaN(checkedAt.getTime());

  return (
    <Card>
      <CardHeader>
        <CardTitle className="break-words">{name}</CardTitle>
        <CardDescription className="break-all font-mono">
          {url}
        </CardDescription>
        <CardAction>
          <Badge variant="outline" className={statusClasses[status]}>
            {statusLabels[status]}
          </Badge>
        </CardAction>
      </CardHeader>
      <CardFooter className="flex-wrap justify-between gap-4">
        <p className="text-muted-foreground">
          Last check: {" "}
          {hasValidCheck && checkedAt ? (
            <time dateTime={checkedAt.toISOString()}>
              {checkedAt.toUTCString()}
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
          disabled={pauseDisabled}
          aria-label={`Pause ${name}`}
        >
          Pause
        </Button>
      </CardFooter>
    </Card>
  );
}
