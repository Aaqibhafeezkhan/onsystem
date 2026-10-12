"use client";

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
import { formatDistanceToNowStrict } from "date-fns";
import { useHydrated } from "@/hooks/use-hydrated";

export interface MonitorStatusCardProps extends React.ComponentProps<typeof Card> {
  name: string;
  url: string;
  status: "up" | "down" | "degraded" | "success" | "destructive" | "warning" | string;
  lastCheck: Date | string | number;
  onPause?: () => void;
}

export function MonitorStatusCard({
  name,
  url,
  status,
  lastCheck,
  onPause,
  className,
  ...props
}: MonitorStatusCardProps) {
  const hydrated = useHydrated();

  const getStatusConfig = (s: string) => {
    switch (s.toLowerCase()) {
      case "up":
      case "success":
      case "active":
        return { variant: "success" as const, label: "Up" };
      case "down":
      case "destructive":
      case "error":
        return { variant: "destructive" as const, label: "Down" };
      case "degraded":
      case "warning":
        return { variant: "warning" as const, label: "Degraded" };
      default:
        return { variant: "default" as const, label: s };
    }
  };

  const statusConfig = getStatusConfig(status);
  const checkDate = lastCheck instanceof Date ? lastCheck : new Date(lastCheck);
  const isValidDate = !isNaN(checkDate.getTime());

  return (
    <Card className={cn("gap-4 py-4 shadow-none", className)} {...props}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 px-4 [.border-b]:pb-4">
        <div className="flex flex-col gap-1 truncate pr-2">
          <CardTitle className="text-base font-semibold truncate">{name}</CardTitle>
          <CardDescription className="font-mono text-xs truncate">{url}</CardDescription>
        </div>
        <StatusBadge variant={statusConfig.variant} dot>
          {statusConfig.label}
        </StatusBadge>
      </CardHeader>
      <CardContent className="flex items-center justify-between px-4 text-xs text-muted-foreground">
        <div>
          {isValidDate ? (
            <HoverCardTimestamp date={checkDate}>
              <span className="cursor-help">
                Last checked {hydrated ? formatDistanceToNowStrict(checkDate, { addSuffix: true }) : ""}
              </span>
            </HoverCardTimestamp>
          ) : (
            <span>Last checked {String(lastCheck)}</span>
          )}
        </div>
        <Button variant="outline" size="sm" onClick={onPause}>
          Pause
        </Button>
      </CardContent>
    </Card>
  );
}
