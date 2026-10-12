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
import { TableCellDate } from "@/components/data-table/table-cell-date";

export interface MonitorStatusCardProps extends React.ComponentProps<typeof Card> {
  name: string;
  url: string;
  status: "up" | "down" | "degraded" | "active" | "error" | "warning" | string;
  lastCheck?: Date | string;
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
  const getStatusConfig = (s: string) => {
    const lower = s.toLowerCase();
    if (
      lower === "up" ||
      lower === "active" ||
      lower === "normal" ||
      lower === "success"
    ) {
      return { variant: "success" as const, label: "Up" };
    }
    if (
      lower === "down" ||
      lower === "error" ||
      lower === "failing" ||
      lower === "destructive"
    ) {
      return { variant: "destructive" as const, label: "Down" };
    }
    if (lower === "degraded" || lower === "warning") {
      return { variant: "warning" as const, label: "Degraded" };
    }
    return { variant: "default" as const, label: s };
  };

  const statusConfig = getStatusConfig(status);

  return (
    <Card className={cn("gap-4 py-4 shadow-none", className)} {...props}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 px-4 [.border-b]:pb-4">
        <div className="flex flex-col gap-1 overflow-hidden pr-2">
          <CardTitle className="text-base font-semibold truncate">
            {name}
          </CardTitle>
          <CardDescription className="font-mono text-xs text-muted-foreground truncate">
            {url}
          </CardDescription>
        </div>
        <StatusBadge variant={statusConfig.variant} dot className="shrink-0">
          {statusConfig.label}
        </StatusBadge>
      </CardHeader>
      <CardContent className="flex items-center justify-between px-4 text-xs text-muted-foreground">
        <div className="flex items-center gap-1.5">
          <span>Last check:</span>
          <TableCellDate
            value={lastCheck}
            className="inline font-mono text-xs text-muted-foreground"
          />
        </div>
      </CardContent>
      <CardFooter className="flex justify-end px-4 [.border-t]:pt-4">
        <Button variant="outline" size="sm" onClick={onPause}>
          Pause
        </Button>
      </CardFooter>
    </Card>
  );
}
