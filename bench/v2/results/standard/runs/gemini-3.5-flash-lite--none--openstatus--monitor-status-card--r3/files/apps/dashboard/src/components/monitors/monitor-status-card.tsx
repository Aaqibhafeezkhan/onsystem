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

export type MonitorStatus =
  | "up"
  | "down"
  | "degraded"
  | "success"
  | "error"
  | "active"
  | string;

export interface MonitorStatusCardProps
  extends React.ComponentProps<typeof Card> {
  name: string;
  url: string;
  status: MonitorStatus;
  lastCheck?: Date | string | number | null;
  onPause?: () => void;
}

function getStatusConfig(status: string) {
  switch (status.toLowerCase()) {
    case "up":
    case "success":
    case "active":
      return { variant: "success" as const, label: "Up" };
    case "down":
    case "error":
    case "destructive":
      return { variant: "destructive" as const, label: "Down" };
    case "degraded":
    case "warning":
      return { variant: "warning" as const, label: "Degraded" };
    default:
      return { variant: "default" as const, label: status || "Unknown" };
  }
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
  const statusConfig = getStatusConfig(status);

  return (
    <Card className={cn("gap-4 py-4 shadow-none", className)} {...props}>
      <CardHeader className="px-4 [.border-b]:pb-0">
        <div className="flex items-center justify-between gap-2">
          <CardTitle className="text-base font-semibold truncate">
            {name}
          </CardTitle>
          <StatusBadge dot variant={statusConfig.variant}>
            {statusConfig.label}
          </StatusBadge>
        </div>
        <CardDescription className="truncate font-mono text-xs">
          {url}
        </CardDescription>
      </CardHeader>
      <CardContent className="px-4 text-xs text-muted-foreground flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <span>Last checked:</span>
          <TableCellDate value={lastCheck} className="inline font-mono" />
        </div>
      </CardContent>
      <CardFooter className="px-4 [.border-t]:pt-4 flex justify-end">
        <Button variant="outline" size="sm" onClick={onPause}>
          Pause
        </Button>
      </CardFooter>
    </Card>
  );
}
