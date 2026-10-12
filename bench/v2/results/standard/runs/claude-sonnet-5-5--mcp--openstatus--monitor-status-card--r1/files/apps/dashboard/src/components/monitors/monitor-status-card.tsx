import { Badge } from "@openstatus/ui/components/ui/badge";
import { Button } from "@openstatus/ui/components/ui/button";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@openstatus/ui/components/ui/card";

type MonitorStatus = "up" | "down" | "degraded";

const STATUS_STYLES: Record<MonitorStatus, { label: string; className: string }> = {
  up: { label: "Up", className: "bg-success text-primary-foreground" },
  down: { label: "Down", className: "bg-destructive text-primary-foreground" },
  degraded: { label: "Degraded", className: "bg-warning text-primary-foreground" },
};

export interface MonitorStatusCardProps {
  name: string;
  url: string;
  status: MonitorStatus;
  lastCheckedAt: Date | string;
  onPause?: () => void;
}

export function MonitorStatusCard({
  name,
  url,
  status,
  lastCheckedAt,
  onPause,
}: MonitorStatusCardProps) {
  const { label, className } = STATUS_STYLES[status];
  const date = new Date(lastCheckedAt);

  return (
    <Card>
      <CardHeader>
        <CardTitle>{name}</CardTitle>
        <CardDescription>{url}</CardDescription>
        <CardAction>
          <Badge className={className}>{label}</Badge>
        </CardAction>
      </CardHeader>
      <CardContent className="flex items-center justify-between gap-2">
        <span className="text-muted-foreground text-sm">
          Last checked{" "}
          <time dateTime={date.toISOString()}>{date.toLocaleString()}</time>
        </span>
        <Button variant="outline" size="sm" onClick={onPause}>
          Pause
        </Button>
      </CardContent>
    </Card>
  );
}
