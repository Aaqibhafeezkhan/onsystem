import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@openstatus/ui/components/ui/card";
import { Badge } from "@openstatus/ui/components/ui/badge";
import { Button } from "@openstatus/ui/components/ui/button";
import { cn } from "@openstatus/ui/lib/utils";

type MonitorStatus = "up" | "down" | "degraded";

export interface MonitorStatusCardProps {
  name: string;
  url: string;
  status: MonitorStatus;
  lastChecked: string | Date;
  onPause?: () => void;
}

const statusStyles: Record<MonitorStatus, string> = {
  up: "border-success/20 bg-success/10 text-success",
  down: "border-destructive/20 bg-destructive/10 text-destructive",
  degraded: "border-warning/20 bg-warning/10 text-warning",
};

const statusLabels: Record<MonitorStatus, string> = {
  up: "Up",
  down: "Down",
  degraded: "Degraded",
};

export function MonitorStatusCard({
  name,
  url,
  status,
  lastChecked,
  onPause,
}: MonitorStatusCardProps) {
  const checkedAt =
    lastChecked instanceof Date
      ? lastChecked.toLocaleString()
      : lastChecked;

  return (
    <Card>
      <CardHeader className="flex-row items-start justify-between gap-4">
        <div className="min-w-0 space-y-1">
          <CardTitle className="truncate">{name}</CardTitle>
          <CardDescription className="truncate">{url}</CardDescription>
        </div>
        <Badge
          variant="outline"
          className={cn("shrink-0 capitalize", statusStyles[status])}
          aria-label={`Monitor status: ${statusLabels[status]}`}
        >
          {statusLabels[status]}
        </Badge>
      </CardHeader>
      <CardContent className="flex flex-wrap items-center justify-between gap-4">
        <p className="text-sm text-muted-foreground">
          Last checked: <time>{checkedAt}</time>
        </p>
        <Button type="button" variant="outline" size="sm" onClick={onPause}>
          Pause
        </Button>
      </CardContent>
    </Card>
  );
}
