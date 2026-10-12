import { Button } from "@openstatus/ui/components/ui/button";
import {
  Card,
  CardContent,
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
  lastChecked: string;
  onPause: () => void;
};

const statusDetails: Record<
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
  const statusInfo = statusDetails[status];

  return (
    <Card className="gap-4 shadow-none">
      <CardHeader className="flex-row items-start justify-between gap-4">
        <div className="min-w-0 space-y-1">
          <CardTitle className="truncate">{name}</CardTitle>
          <a
            href={url}
            target="_blank"
            rel="noreferrer"
            className="text-muted-foreground block truncate text-sm underline-offset-4 hover:underline"
          >
            {url}
          </a>
        </div>
        <StatusBadge variant={statusInfo.variant}>{statusInfo.label}</StatusBadge>
      </CardHeader>
      <CardContent className="text-muted-foreground text-sm">
        <p>
          <span className="text-foreground font-medium">Last checked:</span>{" "}
          {lastChecked}
        </p>
      </CardContent>
      <CardFooter className="justify-end">
        <Button type="button" variant="outline" size="sm" onClick={onPause}>
          Pause
        </Button>
      </CardFooter>
    </Card>
  );
}
