import { Button } from "@openstatus/ui/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@openstatus/ui/components/ui/card";

import { StatusBadge } from "@/components/common/status-badge";

type MonitorStatus = "up" | "down" | "degraded";

type MonitorStatusCardProps = {
  name: string;
  url: string;
  status: MonitorStatus;
  /** A display-ready value, such as "2 minutes ago". */
  lastChecked: string;
  onPause?: () => void;
};

const statusConfig: Record<
  MonitorStatus,
  { label: string; variant: "success" | "destructive" | "warning" }
> = {
  up: { label: "Up", variant: "success" },
  down: { label: "Down", variant: "destructive" },
  degraded: { label: "Degraded", variant: "warning" },
};

export function MonitorStatusCard({
  name,
  url,
  status,
  lastChecked,
  onPause,
}: MonitorStatusCardProps) {
  const currentStatus = statusConfig[status];

  return (
    <Card className="gap-4 shadow-none">
      <CardHeader className="flex-row items-start justify-between gap-4">
        <div className="min-w-0 space-y-1">
          <CardTitle className="truncate">{name}</CardTitle>
          <CardDescription className="truncate">
            <a href={url} className="hover:text-foreground">
              {url}
            </a>
          </CardDescription>
        </div>
        <StatusBadge variant={currentStatus.variant}>
          {currentStatus.label}
        </StatusBadge>
      </CardHeader>
      <CardContent>
        <p className="text-sm">
          <span className="text-muted-foreground">Last checked </span>
          <span>{lastChecked}</span>
        </p>
      </CardContent>
      <CardFooter className="justify-end">
        <Button type="button" variant="outline" onClick={onPause}>
          Pause
        </Button>
      </CardFooter>
    </Card>
  );
}
