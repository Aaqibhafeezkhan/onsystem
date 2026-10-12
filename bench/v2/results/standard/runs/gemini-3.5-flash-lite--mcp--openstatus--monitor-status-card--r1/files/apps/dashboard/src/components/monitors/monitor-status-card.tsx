import type React from "react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from "@openstatus/ui/components/ui/card";
import { Button } from "@openstatus/ui/components/ui/button";
import { StatusBadge } from "@/components/common/status-badge";
import { cn } from "@openstatus/ui/lib/utils";

export interface MonitorStatusCardProps extends React.ComponentProps<typeof Card> {
  name: string;
  url: string;
  status: "up" | "down" | "degraded" | "Normal" | "Failing" | "Degraded" | "success" | "error" | "warning" | string;
  lastCheck: string;
  onPause?: () => void;
  pauseButtonProps?: React.ComponentProps<typeof Button>;
}

function getStatusVariant(status: string): {
  variant: "success" | "destructive" | "warning" | "default";
  label: string;
} {
  const lower = status.toLowerCase();
  if (
    lower === "up" ||
    lower === "normal" ||
    lower === "success" ||
    lower === "healthy"
  ) {
    return { variant: "success", label: "Up" };
  }
  if (
    lower === "down" ||
    lower === "failing" ||
    lower === "error" ||
    lower === "destructive"
  ) {
    return { variant: "destructive", label: "Down" };
  }
  if (lower === "degraded" || lower === "warning" || lower === "warn") {
    return { variant: "warning", label: "Degraded" };
  }
  return { variant: "default", label: status };
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
  const { variant, label } = getStatusVariant(status);

  return (
    <Card className={cn("gap-4 p-4 shadow-none", className)} {...props}>
      <CardHeader className="p-0 flex flex-row items-start justify-between space-y-0">
        <div className="flex flex-col gap-1 min-w-0 pr-2">
          <CardTitle className="text-base font-semibold truncate">
            {name}
          </CardTitle>
          <CardDescription className="text-xs font-mono truncate text-muted-foreground">
            {url}
          </CardDescription>
        </div>
        <StatusBadge variant={variant} dot>
          {label}
        </StatusBadge>
      </CardHeader>

      <CardFooter className="p-0 pt-3 border-t border-border flex items-center justify-between text-xs text-muted-foreground">
        <span>Last checked: {lastCheck}</span>
        <Button
          variant="outline"
          size="sm"
          onClick={onPause}
          {...pauseButtonProps}
        >
          Pause
        </Button>
      </CardFooter>
    </Card>
  );
}
