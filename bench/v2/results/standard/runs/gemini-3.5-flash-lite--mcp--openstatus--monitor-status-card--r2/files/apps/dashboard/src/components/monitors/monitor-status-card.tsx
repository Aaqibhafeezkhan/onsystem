"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@openstatus/ui/components/ui/card";
import { Button } from "@openstatus/ui/components/ui/button";
import { cn } from "@openstatus/ui/lib/utils";
import { StatusBadge } from "@/components/common/status-badge";
import { TableCellDate } from "@/components/data-table/table-cell-date";

export interface MonitorStatusCardProps extends React.ComponentProps<typeof Card> {
  name: string;
  url: string;
  status: "up" | "down" | "degraded" | string;
  lastCheck: Date | string;
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
  const getStatusVariant = (s: string) => {
    const lower = s.toLowerCase();
    if (lower === "up" || lower === "normal" || lower === "success") {
      return { variant: "success" as const, label: "Up" };
    }
    if (lower === "down" || lower === "failing" || lower === "error" || lower === "destructive") {
      return { variant: "destructive" as const, label: "Down" };
    }
    if (lower === "degraded" || lower === "warning") {
      return { variant: "warning" as const, label: "Degraded" };
    }
    return { variant: "default" as const, label: s };
  };

  const statusConfig = getStatusVariant(status);

  return (
    <Card className={cn("gap-4 py-4 shadow-none", className)} {...props}>
      <CardHeader className="px-4 [.border-b]:pb-4 flex flex-row items-start justify-between gap-4 space-y-0">
        <div className="space-y-1">
          <CardTitle className="text-base font-semibold">{name}</CardTitle>
          <CardDescription className="font-mono text-xs text-muted-foreground truncate max-w-[280px] sm:max-w-[360px]">
            {url}
          </CardDescription>
        </div>
        <StatusBadge variant={statusConfig.variant} dot>
          {statusConfig.label}
        </StatusBadge>
      </CardHeader>
      <CardContent className="px-4 flex items-center justify-between text-sm">
        <span className="text-muted-foreground">Last check</span>
        <TableCellDate value={lastCheck} className="text-xs font-mono" />
      </CardContent>
      <CardFooter className="px-4 [.border-t]:pt-4 flex justify-end">
        <Button variant="outline" size="sm" onClick={onPause}>
          {pauseLabel}
        </Button>
      </CardFooter>
    </Card>
  );
}
