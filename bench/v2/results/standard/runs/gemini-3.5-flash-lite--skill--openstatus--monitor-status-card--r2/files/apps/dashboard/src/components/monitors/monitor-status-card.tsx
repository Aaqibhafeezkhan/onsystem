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
import { cn } from "@openstatus/ui/lib/utils";
import type React from "react";

import { StatusBadge } from "@/components/common/status-badge";

export interface MonitorStatusCardProps
  extends React.ComponentProps<typeof Card> {
  name?: string;
  url?: string;
  status?: string;
  lastCheck?: string | Date;
  lastChecked?: string | Date;
  onPause?: () => void;
  monitor?: {
    name?: string;
    url?: string;
    status?: string;
    lastCheck?: string | Date;
    lastChecked?: string | Date;
    [key: string]: any;
  };
}

export function MonitorStatusCard({
  name: nameProp,
  url: urlProp,
  status: statusProp,
  lastCheck: lastCheckProp,
  lastChecked: lastCheckedProp,
  onPause,
  monitor,
  className,
  ...props
}: MonitorStatusCardProps) {
  const name = nameProp ?? monitor?.name ?? "Monitor";
  const url = urlProp ?? monitor?.url ?? "";
  const rawStatus = statusProp ?? monitor?.status ?? "active";
  const lastCheck = lastCheckProp ?? monitor?.lastCheck ?? monitor?.lastChecked;

  const normalizedStatus =
    typeof rawStatus === "string" ? rawStatus.toLowerCase() : "active";

  let statusVariant: "success" | "warning" | "destructive" | "default" =
    "success";
  let statusLabel = "Up";

  if (
    normalizedStatus === "down" ||
    normalizedStatus === "error" ||
    normalizedStatus === "failing" ||
    normalizedStatus === "failing"
  ) {
    statusVariant = "destructive";
    statusLabel = "Down";
  } else if (
    normalizedStatus === "degraded" ||
    normalizedStatus === "warning"
  ) {
    statusVariant = "warning";
    statusLabel = "Degraded";
  } else if (
    normalizedStatus === "active" ||
    normalizedStatus === "up" ||
    normalizedStatus === "success" ||
    normalizedStatus === "normal" ||
    normalizedStatus === "operational"
  ) {
    statusVariant = "success";
    statusLabel = "Up";
  } else {
    statusVariant = "default";
    statusLabel = rawStatus.charAt(0).toUpperCase() + rawStatus.slice(1);
  }

  const formattedLastCheck = lastCheck
    ? typeof lastCheck === "string"
      ? lastCheck
      : lastCheck instanceof Date
        ? lastCheck.toLocaleString()
        : String(lastCheck)
    : null;

  return (
    <Card
      className={cn("flex flex-col justify-between shadow-none", className)}
      {...props}
    >
      <CardHeader className="flex flex-row items-start justify-between gap-2 space-y-0 pb-3">
        <div className="flex flex-col gap-1 truncate">
          <CardTitle className="truncate text-base font-medium">
            {name}
          </CardTitle>
          <CardDescription className="truncate font-mono text-xs text-muted-foreground">
            {url}
          </CardDescription>
        </div>
        <StatusBadge variant={statusVariant} dot>
          {statusLabel}
        </StatusBadge>
      </CardHeader>
      <CardContent className="pb-3 text-xs text-muted-foreground">
        {formattedLastCheck ? (
          <div className="flex items-center gap-1.5 font-mono">
            <span>Last checked:</span>
            <span>{formattedLastCheck}</span>
          </div>
        ) : (
          <span className="font-mono">No checks yet</span>
        )}
      </CardContent>
      <CardFooter className="pt-0">
        <Button variant="outline" size="sm" className="w-full" onClick={onPause}>
          Pause
        </Button>
      </CardFooter>
    </Card>
  );
}
