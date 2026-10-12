import { Button } from "@openstatus/ui/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@openstatus/ui/components/ui/card";

import { StatusBadge } from "@/components/common/status-badge";

export type MonitorStatus = "up" | "down" | "degraded";

export interface MonitorStatusCardProps {
  name: string;
  url: string;
  status: MonitorStatus;
  lastChecked: Date | string;
  onPause: () => void;
}

const statusDetails: Record<MonitorStatus, { label: string; variant: "success" | "destructive" | "warning" }> = {
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
  const statusDetail = statusDetails[status];
  const lastCheckedLabel =
    lastChecked instanceof Date ? lastChecked.toLocaleString() : lastChecked;

  return (
    <Card className="gap-4 py-4 shadow-none">
      <CardHeader className="flex flex-row items-start justify-between gap-4 px-4">
        <div className="min-w-0 space-y-1">
          <CardTitle className="truncate text-base">{name}</CardTitle>
          <a
            href={url}
            target="_blank"
            rel="noreferrer"
            className="text-muted-foreground block truncate text-sm underline-offset-4 hover:underline"
          >
            {url}
          </a>
        </div>
        <StatusBadge variant={statusDetail.variant} dot>
          {statusDetail.label}
        </StatusBadge>
      </CardHeader>
      <CardContent className="flex items-center justify-between gap-4 px-4">
        <p className="text-muted-foreground text-sm">
          Last checked <span className="text-foreground">{lastCheckedLabel}</span>
        </p>
        <Button variant="outline" size="sm" onClick={onPause}>
          Pause
        </Button>
      </CardContent>
    </Card>
  );
}
