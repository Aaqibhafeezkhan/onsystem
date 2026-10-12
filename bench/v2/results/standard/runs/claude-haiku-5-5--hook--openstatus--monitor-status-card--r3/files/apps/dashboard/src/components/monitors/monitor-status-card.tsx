"use client";

import { Button } from "@openstatus/ui/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@openstatus/ui/components/ui/card";
import { formatDistanceToNowStrict } from "date-fns";

import { StatusBadge } from "../common/status-badge";

export type MonitorStatus = "up" | "down" | "degraded";

const statusConfig: Record<
  MonitorStatus,
  {
    label: string;
    variant: "success" | "destructive" | "warning";
  }
> = {
  up: { label: "Up", variant: "success" },
  down: { label: "Down", variant: "destructive" },
  degraded: { label: "Degraded", variant: "warning" },
};

export interface MonitorStatusCardProps {
  name: string;
  url: string;
  status: MonitorStatus;
  lastCheckedAt: Date | string | number;
  onPause?: () => void;
}

export function MonitorStatusCard({
  name,
  url,
  status,
  lastCheckedAt,
  onPause,
}: MonitorStatusCardProps) {
  const config = statusConfig[status];
  const checkedAt = new Date(lastCheckedAt);
  const isValidDate = !Number.isNaN(checkedAt.getTime());

  return (
    <Card className="gap-4 py-4 shadow-none">
      <CardHeader className="px-4">
        <CardTitle className="font-commit-mono text-sm font-medium tracking-tight">
          {name}
        </CardTitle>
        <CardDescription className="truncate font-mono text-xs">
          {url}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-2 px-4">
        <div className="flex items-center justify-between gap-2">
          <span className="text-muted-foreground text-sm">Status</span>
          <StatusBadge variant={config.variant} dot>
            {config.label}
          </StatusBadge>
        </div>
        <div className="flex items-center justify-between gap-2">
          <span className="text-muted-foreground text-sm">Last check</span>
          {isValidDate ? (
            <time
              dateTime={checkedAt.toISOString()}
              title={checkedAt.toISOString()}
              className="text-foreground font-mono text-xs"
            >
              {formatDistanceToNowStrict(checkedAt, { addSuffix: true })}
            </time>
          ) : (
            <span className="text-muted-foreground font-mono text-xs">
              Never
            </span>
          )}
        </div>
      </CardContent>
      <CardFooter className="border-t px-4 pt-4">
        <Button
          type="button"
          variant="outline"
          className="w-full"
          onClick={onPause}
        >
          Pause
        </Button>
      </CardFooter>
    </Card>
  );
}
