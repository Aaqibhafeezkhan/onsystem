"use client";

import { Button } from "@openstatus/ui/components/ui/button";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@openstatus/ui/components/ui/card";
import { cn } from "@openstatus/ui/lib/utils";
import type React from "react";

import { StatusBadge } from "@/components/common/status-badge";

export interface MonitorStatusCardProps extends React.ComponentProps<typeof Card> {
  name: string;
  url: string;
  status: "up" | "down" | "degraded" | "success" | "error" | "warning";
  lastCheck: string | Date;
  onPause?: () => void;
  isPaused?: boolean;
}

export function MonitorStatusCard({
  name,
  url,
  status,
  lastCheck,
  onPause,
  isPaused,
  className,
  ...props
}: MonitorStatusCardProps) {
  const statusConfig: Record<
    string,
    { label: string; variant: "success" | "destructive" | "warning" | "default" }
  > = {
    up: { label: "Up", variant: "success" },
    success: { label: "Up", variant: "success" },
    down: { label: "Down", variant: "destructive" },
    error: { label: "Down", variant: "destructive" },
    destructive: { label: "Down", variant: "destructive" },
    degraded: { label: "Degraded", variant: "warning" },
    warning: { label: "Degraded", variant: "warning" },
  };

  const normalizedStatus = status.toLowerCase();
  const currentStatus = statusConfig[normalizedStatus] || {
    label: status,
    variant: "default",
  };

  const formattedLastCheck =
    lastCheck instanceof Date ? lastCheck.toLocaleString() : lastCheck;

  return (
    <Card className={cn("w-full", className)} {...props}>
      <CardHeader>
        <CardTitle>{name}</CardTitle>
        <CardDescription className="truncate">{url}</CardDescription>
        <CardAction>
          <StatusBadge variant={currentStatus.variant} dot>
            {currentStatus.label}
          </StatusBadge>
        </CardAction>
      </CardHeader>
      <CardContent>
        <div className="text-muted-foreground text-xs">
          Last checked: {formattedLastCheck}
        </div>
      </CardContent>
      <CardFooter className="flex justify-end">
        <Button
          variant="outline"
          size="sm"
          onClick={onPause}
          disabled={isPaused}
        >
          {isPaused ? "Paused" : "Pause"}
        </Button>
      </CardFooter>
    </Card>
  );
}
