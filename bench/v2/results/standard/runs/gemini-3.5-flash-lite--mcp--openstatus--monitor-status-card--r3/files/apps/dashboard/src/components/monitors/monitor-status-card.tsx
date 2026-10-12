"use client";

import { Button } from "@openstatus/ui/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@openstatus/ui/components/ui/card";
import { cn } from "@openstatus/ui/lib/utils";

import { StatusBadge } from "@/components/common/status-badge";

export interface MonitorStatusCardProps extends React.ComponentProps<typeof Card> {
  name: string;
  url: string;
  status: "up" | "down" | "degraded" | string;
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
  const getStatusVariant = (st: string) => {
    switch (st.toLowerCase()) {
      case "up":
      case "active":
      case "success":
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

  const variant = getStatusVariant(status);
  const formattedLastCheck =
    lastCheck instanceof Date ? lastCheck.toLocaleString() : lastCheck;
  const capitalizedStatus =
    status.charAt(0).toUpperCase() + status.slice(1).toLowerCase();

  return (
    <Card className={cn("gap-4 py-4 shadow-none", className)} {...props}>
      <CardHeader className="flex flex-row items-center justify-between px-4 [.border-b]:pb-4">
        <div className="space-y-1 overflow-hidden pr-2">
          <CardTitle className="text-base font-semibold truncate">
            {name}
          </CardTitle>
          <CardDescription className="truncate text-xs text-muted-foreground font-mono">
            {url}
          </CardDescription>
        </div>
        <StatusBadge variant={variant} dot>
          {capitalizedStatus}
        </StatusBadge>
      </CardHeader>
      <CardContent className="flex items-center justify-between px-4 text-xs text-muted-foreground">
        <div>Last checked: {formattedLastCheck}</div>
        <Button variant="outline" size="sm" onClick={onPause}>
          {isPaused ? "Resume" : "Pause"}
        </Button>
      </CardContent>
    </Card>
  );
}
