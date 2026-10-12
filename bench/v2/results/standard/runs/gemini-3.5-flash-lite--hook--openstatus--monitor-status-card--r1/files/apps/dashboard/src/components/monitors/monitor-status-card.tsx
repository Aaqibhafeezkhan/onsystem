"use client";

import * as React from "react";
import { format } from "date-fns";
import { Pause } from "lucide-react";
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
import { HoverCardTimestamp } from "@/components/common/hover-card-timestamp";
import { useHydrated } from "@/hooks/use-hydrated";

export interface MonitorStatusCardProps
  extends React.ComponentProps<typeof Card> {
  name: string;
  url: string;
  status: "up" | "down" | "degraded" | "success" | "error" | "warning" | "active" | string;
  lastCheck?: Date | string | null;
  onPause?: () => void;
  pauseButtonProps?: React.ComponentProps<typeof Button>;
}

export function MonitorStatusCard({
  name,
  url,
  status,
  lastCheck,
  onPause,
  pauseButtonProps,
  className,
  ...props
}: MonitorStatusCardProps) {
  const hydrated = useHydrated();

  const getStatusVariant = (st: string) => {
    switch (st.toLowerCase()) {
      case "up":
      case "success":
      case "active":
        return "success";
      case "down":
      case "error":
      case "destructive":
        return "destructive";
      case "degraded":
      case "warning":
        return "warning";
      default:
        return "default";
    }
  };

  const getStatusLabel = (st: string) => {
    switch (st.toLowerCase()) {
      case "up":
      case "success":
      case "active":
        return "Up";
      case "down":
      case "error":
      case "destructive":
        return "Down";
      case "degraded":
      case "warning":
        return "Degraded";
      default:
        return st;
    }
  };

  const variant = getStatusVariant(status);
  const label = getStatusLabel(status);

  const dateObj =
    lastCheck instanceof Date
      ? lastCheck
      : typeof lastCheck === "string"
        ? new Date(lastCheck)
        : null;
  const isValidDate = dateObj && !Number.isNaN(dateObj.getTime());

  return (
    <Card className={cn("gap-4 py-4 shadow-none", className)} {...props}>
      <CardHeader className="flex flex-row items-center justify-between gap-4 px-4 [.border-b]:pb-4">
        <div className="flex flex-col gap-1 min-w-0">
          <CardTitle className="truncate text-base font-semibold">
            {name}
          </CardTitle>
          <CardDescription className="truncate text-xs">
            {url}
          </CardDescription>
        </div>
        <StatusBadge variant={variant} dot>
          {label}
        </StatusBadge>
      </CardHeader>
      <CardContent className="flex items-center justify-between px-4 text-xs text-muted-foreground">
        <div>
          <span>Last check: </span>
          {isValidDate ? (
            <HoverCardTimestamp date={dateObj}>
              <span className="font-medium text-foreground cursor-pointer underline underline-offset-4 decoration-muted-foreground/30">
                {hydrated ? format(dateObj, "LLL dd, y HH:mm:ss") : null}
              </span>
            </HoverCardTimestamp>
          ) : (
            <span className="font-medium text-foreground">
              {typeof lastCheck === "string" ? lastCheck : "Never"}
            </span>
          )}
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={onPause}
          {...pauseButtonProps}
        >
          <Pause className="mr-1.5 size-3.5" />
          Pause
        </Button>
      </CardContent>
    </Card>
  );
}
