import * as React from "react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@openstatus/ui/components/ui/card";
import { Button } from "@openstatus/ui/components/ui/button";
import { StatusBadge } from "@/components/common/status-badge";
import { cn } from "@/lib/utils";

export interface MonitorStatusCardProps extends React.ComponentProps<typeof Card> {
  name: string;
  url: string;
  status: "up" | "down" | "degraded" | string;
  statusLabel?: string;
  lastCheck: string | Date;
  onPause?: () => void;
  isPaused?: boolean;
}

function getStatusConfig(status: string) {
  const lower = status.toLowerCase();
  if (lower === "up" || lower === "normal" || lower === "active") {
    return { variant: "success" as const, label: "Up" };
  }
  if (lower === "down" || lower === "failing" || lower === "error") {
    return { variant: "destructive" as const, label: "Down" };
  }
  if (lower === "degraded" || lower === "warning") {
    return { variant: "warning" as const, label: "Degraded" };
  }
  return { variant: "default" as const, label: status };
}

export function MonitorStatusCard({
  name,
  url,
  status,
  statusLabel,
  lastCheck,
  onPause,
  isPaused = false,
  className,
  ...props
}: MonitorStatusCardProps) {
  const config = getStatusConfig(status);
  const displayLabel = statusLabel ?? config.label;

  return (
    <Card className={cn("flex flex-col justify-between", className)} {...props}>
      <CardHeader className="flex flex-row items-start justify-between gap-4 pb-2">
        <div className="space-y-1">
          <CardTitle className="text-base font-medium">{name}</CardTitle>
          <CardDescription className="font-mono text-xs truncate max-w-[280px]">
            {url}
          </CardDescription>
        </div>
        <StatusBadge variant={config.variant} dot>
          {displayLabel}
        </StatusBadge>
      </CardHeader>
      <CardContent className="pb-2 text-xs text-muted-foreground">
        <span>Last checked: </span>
        <span className="font-mono">{typeof lastCheck === "string" ? lastCheck : lastCheck.toLocaleString()}</span>
      </CardContent>
      <CardFooter className="pt-2 flex justify-end">
        <Button
          variant="outline"
          size="sm"
          onClick={onPause}
        >
          {isPaused ? "Resume" : "Pause"}
        </Button>
      </CardFooter>
    </Card>
  );
}
