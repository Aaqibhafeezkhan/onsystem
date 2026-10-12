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

export type MonitorStatus = "up" | "down" | "degraded";

const STATUS: Record<MonitorStatus, { label: string; className: string }> = {
  up: { label: "Up", className: "border-success bg-success/15 text-success" },
  down: { label: "Down", className: "border-error bg-error/15 text-error" },
  degraded: {
    label: "Degraded",
    className: "border-warning bg-warning/15 text-warning",
  },
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
  const { label, className } = STATUS[status];
  const date = new Date(lastCheckedAt);

  return (
    <Card>
      <CardHeader>
        <CardTitle>{name}</CardTitle>
        <CardDescription>{url}</CardDescription>
        <CardAction>
          <Badge variant="outline" className={className}>
            {label}
          </Badge>
        </CardAction>
      </CardHeader>
      <CardContent className="flex items-center justify-between gap-2">
        <p className="text-muted-foreground text-sm">
          Last checked{" "}
          <time dateTime={date.toISOString()}>{date.toLocaleString()}</time>
        </p>
        <Button variant="outline" size="sm" onClick={onPause}>
          Pause
        </Button>
      </CardContent>
    </Card>
  );
}
