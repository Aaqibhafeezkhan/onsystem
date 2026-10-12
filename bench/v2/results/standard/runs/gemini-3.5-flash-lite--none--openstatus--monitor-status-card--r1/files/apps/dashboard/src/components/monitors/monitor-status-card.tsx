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
import { TableCellDate } from "@/components/data-table/table-cell-date";

export interface MonitorStatusCardProps
  extends React.ComponentProps<typeof Card> {
  name: string;
  url: string;
  status: "up" | "down" | "degraded" | string;
  lastCheck?: string | Date | number | null;
  lastCheckAt?: string | Date | number | null;
  onPause?: () => void;
  pauseButtonProps?: React.ComponentProps<typeof Button>;
}

export function MonitorStatusCard({
  name,
  url,
  status,
  lastCheck,
  lastCheckAt,
  onPause,
  pauseButtonProps,
  className,
  ...props
}: MonitorStatusCardProps) {
  const checkTime = lastCheck ?? lastCheckAt;

  const normalizedStatus = status.toLowerCase();
  const isUp =
    normalizedStatus === "up" ||
    normalizedStatus === "success" ||
    normalizedStatus === "active";
  const isDown =
    normalizedStatus === "down" ||
    normalizedStatus === "error" ||
    normalizedStatus === "destructive";
  const isDegraded =
    normalizedStatus === "degraded" || normalizedStatus === "warning";

  const variant = isUp
    ? "success"
    : isDown
      ? "destructive"
      : isDegraded
        ? "warning"
        : "default";
  const label = isUp ? "Up" : isDown ? "Down" : isDegraded ? "Degraded" : status;

  const formattedLastCheck = (() => {
    if (!checkTime) return null;
    if (checkTime instanceof Date) return checkTime;
    if (typeof checkTime === "number") return new Date(checkTime);
    if (typeof checkTime === "string") {
      const parsedNumber = Number(checkTime);
      if (!Number.isNaN(parsedNumber) && checkTime.trim() !== "") {
        return new Date(parsedNumber);
      }
      const parsedDate = new Date(checkTime);
      if (
        !Number.isNaN(parsedDate.getTime()) &&
        Number.isNaN(Number(checkTime))
      ) {
        return parsedDate;
      }
      return checkTime;
    }
    return checkTime;
  })();

  return (
    <Card className={cn("gap-4 py-4 shadow-sm", className)} {...props}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 px-4 [.border-b]:pb-4">
        <div className="space-y-1">
          <CardTitle className="text-base font-semibold">{name}</CardTitle>
          <CardDescription className="font-mono text-xs truncate max-w-[280px]">
            {url}
          </CardDescription>
        </div>
        <StatusBadge variant={variant} dot>
          {label}
        </StatusBadge>
      </CardHeader>
      <CardContent className="flex items-center justify-between px-4 text-xs text-muted-foreground">
        <div>
          {formattedLastCheck ? (
            <span>
              Last check:{" "}
              {formattedLastCheck instanceof Date ? (
                <TableCellDate
                  value={formattedLastCheck}
                  className="font-mono inline text-muted-foreground"
                />
              ) : (
                <span className="font-mono">{formattedLastCheck}</span>
              )}
            </span>
          ) : (
            <span>No checks yet</span>
          )}
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={onPause}
          {...pauseButtonProps}
        >
          Pause
        </Button>
      </CardContent>
    </Card>
  );
}
