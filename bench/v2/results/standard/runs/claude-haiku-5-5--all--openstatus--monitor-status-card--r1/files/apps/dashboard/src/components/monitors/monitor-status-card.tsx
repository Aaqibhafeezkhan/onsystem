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

const statusLabels: Record<MonitorStatus, string> = {
  up: "Up",
  down: "Down",
  degraded: "Degraded",
};

const statusClassNames: Record<MonitorStatus, string> = {
  up: "text-success",
  down: "text-error",
  degraded: "text-warning",
};

const statusDotClassNames: Record<MonitorStatus, string> = {
  up: "bg-success",
  down: "bg-error",
  degraded: "bg-warning",
};

export interface MonitorStatusCardProps {
  name: string;
  url: string;
  status: MonitorStatus;
  lastCheckedAt: Date;
  onPause?: () => void;
}

export function MonitorStatusCard({
  name,
  url,
  status,
  lastCheckedAt,
  onPause,
}: MonitorStatusCardProps) {
  const formattedLastCheck = new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(lastCheckedAt);

  return (
    <Card>
      <CardHeader>
        <CardTitle>{name}</CardTitle>
        <CardDescription>{url}</CardDescription>
        <CardAction>
          <Button variant="outline" size="sm" onClick={onPause}>
            Pause
          </Button>
        </CardAction>
      </CardHeader>
      <CardContent className="flex flex-col gap-2">
        <Badge variant="outline" className={statusClassNames[status]}>
          <span
            aria-hidden="true"
            className={`size-2 rounded-full ${statusDotClassNames[status]}`}
          />
          <span className="font-medium">{statusLabels[status]}</span>
        </Badge>
        <p className="text-muted-foreground text-sm">
          Last checked{" "}
          <time dateTime={lastCheckedAt.toISOString()}>{formattedLastCheck}</time>
        </p>
      </CardContent>
    </Card>
  );
}
