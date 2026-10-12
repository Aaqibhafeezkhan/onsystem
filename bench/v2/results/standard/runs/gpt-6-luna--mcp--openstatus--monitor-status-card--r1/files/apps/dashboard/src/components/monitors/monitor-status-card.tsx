import { StatusBadge } from "@/components/common/status-badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@openstatus/ui/components/ui/card";
import { Button } from "@openstatus/ui/components/ui/button";

export type MonitorStatus = "up" | "down" | "degraded";

export type MonitorStatusCardProps = {
  name: string;
  url: string;
  status: MonitorStatus;
  lastChecked: Date | string;
  onPause?: () => void;
};

const statusDetails: Record<MonitorStatus, { label: string; variant: "success" | "warning" | "destructive" }> = {
  up: { label: "Up", variant: "success" },
  down: { label: "Down", variant: "destructive" },
  degraded: { label: "Degraded", variant: "warning" },
};

function formatLastChecked(value: Date | string) {
  if (typeof value === "string") return value;

  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(value);
}

export function MonitorStatusCard({
  name,
  url,
  status,
  lastChecked,
  onPause,
}: MonitorStatusCardProps) {
  const statusDetail = statusDetails[status];

  return (
    <Card>
      <CardHeader className="flex-row items-start justify-between gap-4">
        <div className="min-w-0 space-y-1">
          <CardTitle>{name}</CardTitle>
          <CardDescription className="break-all">{url}</CardDescription>
        </div>
        <StatusBadge variant={statusDetail.variant}>
          {statusDetail.label}
        </StatusBadge>
      </CardHeader>
      <CardContent className="flex items-center justify-between gap-4">
        <p className="text-sm text-muted-foreground">
          Last checked: {formatLastChecked(lastChecked)}
        </p>
        <Button type="button" variant="outline" size="sm" onClick={onPause}>
          Pause
        </Button>
      </CardContent>
    </Card>
  );
}
