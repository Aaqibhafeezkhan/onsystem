"use client";

import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@openstatus/ui/components/ui/card";
import { Button } from "@openstatus/ui/components/ui/button";
import { cn } from "@openstatus/ui/lib/utils";
import { formatDistanceToNowStrict } from "date-fns";

import { StatusBadge } from "@/components/common/status-badge";

export type MonitorStatus = "up" | "down" | "degraded";

const statusConfig = {
  up: { label: "Up", variant: "success" },
  down: { label: "Down", variant: "destructive" },
  degraded: { label: "Degraded", variant: "warning" },
} as const satisfies Record<
  MonitorStatus,
  {
    label: string;
    variant: "success" | "destructive" | "warning";
  }
>;

export interface MonitorStatusCardProps {
  name: string;
  url: string;
  status: MonitorStatus;
  lastCheckedAt: Date;
  onPause?: () => void;
  className?: string;
}

export function MonitorStatusCard({
  name,
  url,
  status,
  lastCheckedAt,
  onPause,
  className,
}: MonitorStatusCardProps) {
  const { label, variant } = statusConfig[status];

  return (
    <Card className={cn("gap-4 py-4 shadow-none", className)}>
      <CardHeader className="px-4 [.border-b]:pb-4">
        <CardTitle className="truncate">{name}</CardTitle>
        <CardDescription className="truncate font-mono">{url}</CardDescription>
        <CardAction>
          <StatusBadge variant={variant} dot>
            {label}
          </StatusBadge>
        </CardAction>
      </CardHeader>
      <CardContent className="px-4">
        <p className="text-muted-foreground text-sm">
          Last checked{" "}
          <time
            dateTime={lastCheckedAt.toISOString()}
            title={lastCheckedAt.toLocaleString("en-US")}
            className="text-foreground font-medium"
          >
            {formatDistanceToNowStrict(lastCheckedAt, { addSuffix: true })}
          </time>
        </p>
      </CardContent>
      <CardFooter className="px-4 [.border-t]:pt-4">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={onPause}
          aria-label={`Pause ${name}`}
        >
          Pause
        </Button>
      </CardFooter>
    </Card>
  );
}
