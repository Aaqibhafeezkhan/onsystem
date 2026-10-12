"use client";

import {
  Card,
  CardDescription,
  CardTitle,
} from "@openstatus/ui/components/ui/card";
import { Button } from "@openstatus/ui/components/ui/button";
import { cn } from "@openstatus/ui/lib/utils";
import { StatusBadge } from "@/components/common/status-badge";
import { formatDistanceToNowShort } from "@/lib/formatter";
import type { ComponentPropsWithoutRef } from "react";

export interface MonitorStatusCardProps extends ComponentPropsWithoutRef<typeof Card> {
  name: string;
  url: string;
  status: "up" | "down" | "degraded" | "success" | "error" | "active" | "inactive" | string;
  lastCheck?: Date | string | number | null;
  onPause?: () => void;
  pauseLabel?: string;
}

export function MonitorStatusCard({
  name,
  url,
  status,
  lastCheck,
  onPause,
  pauseLabel = "Pause",
  className,
  ...props
}: MonitorStatusCardProps) {
  const getStatusDetails = (s: string) => {
    switch (s.toLowerCase()) {
      case "up":
      case "success":
      case "active":
        return { label: "Up", variant: "success" as const };
      case "down":
      case "error":
      case "inactive":
      case "destructive":
        return { label: "Down", variant: "destructive" as const };
      case "degraded":
      case "warning":
        return { label: "Degraded", variant: "warning" as const };
      default:
        return { label: s, variant: "default" as const };
    }
  };

  const statusDetails = getStatusDetails(status);

  const formattedLastCheck = lastCheck
    ? typeof lastCheck === "string"
      ? lastCheck
      : formatDistanceToNowShort(
          lastCheck instanceof Date ? lastCheck : new Date(lastCheck)
        )
    : null;

  return (
    <Card className={cn("flex flex-col justify-between p-4", className)} {...props}>
      <div className="flex items-start justify-between gap-4">
        <div className="flex flex-col gap-1">
          <CardTitle className="text-base font-semibold">{name}</CardTitle>
          <CardDescription className="font-mono text-xs text-muted-foreground break-all">
            {url}
          </CardDescription>
        </div>
        <StatusBadge variant={statusDetails.variant} dot>
          {statusDetails.label}
        </StatusBadge>
      </div>
      <div className="mt-4 flex items-center justify-between pt-2 border-t border-border/40 text-xs text-muted-foreground">
        <div>
          {formattedLastCheck ? (
            <span>Last checked {formattedLastCheck}</span>
          ) : (
            <span>No checks yet</span>
          )}
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={onPause}
          type="button"
        >
          {pauseLabel}
        </Button>
      </div>
    </Card>
  );
}
