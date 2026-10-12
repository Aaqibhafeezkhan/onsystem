"use client";

import * as React from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@openstatus/ui/components/ui/card";
import { Button } from "@openstatus/ui/components/ui/button";
import { cn } from "@openstatus/ui/lib/utils";
import { StatusBadge } from "@/components/common/status-badge";

export interface MonitorStatusCardProps extends React.ComponentProps<typeof Card> {
  name: string;
  url: string;
  status: "up" | "down" | "degraded" | "active" | "error" | string;
  lastCheck: string | Date;
  onPause?: () => void;
  pauseLabel?: string;
}

function getStatusConfig(status: string) {
  switch (status.toLowerCase()) {
    case "up":
    case "active":
    case "operational":
    case "success":
      return { variant: "success" as const, label: "Up" };
    case "down":
    case "error":
    case "destructive":
    case "fail":
    case "failed":
      return { variant: "destructive" as const, label: "Down" };
    case "degraded":
    case "warning":
      return { variant: "warning" as const, label: "Degraded" };
    default:
      return { variant: "default" as const, label: status };
  }
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
  const statusConfig = getStatusConfig(status);

  return (
    <Card className={cn("gap-4 py-4 shadow-none", className)} {...props}>
      <CardHeader className="px-4 [.border-b]:pb-4">
        <div className="flex items-start justify-between gap-2">
          <div className="space-y-1">
            <CardTitle className="text-base font-semibold">{name}</CardTitle>
            <CardDescription className="font-mono text-xs truncate max-w-[280px]">
              {url}
            </CardDescription>
          </div>
          <StatusBadge variant={statusConfig.variant} dot>
            {statusConfig.label}
          </StatusBadge>
        </div>
      </CardHeader>
      <CardContent className="flex items-center justify-between px-4 text-xs text-muted-foreground">
        <span>
          Last checked:{" "}
          <span className="font-mono text-foreground">
            {typeof lastCheck === "object" && lastCheck instanceof Date
              ? lastCheck.toLocaleString()
              : lastCheck}
          </span>
        </span>
        <Button variant="outline" size="sm" onClick={onPause}>
          {pauseLabel}
        </Button>
      </CardContent>
    </Card>
  );
}
