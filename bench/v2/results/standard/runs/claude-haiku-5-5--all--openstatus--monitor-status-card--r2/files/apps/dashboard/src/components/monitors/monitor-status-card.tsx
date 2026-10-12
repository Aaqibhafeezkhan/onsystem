import { Badge } from "@openstatus/ui/components/ui/badge";
import { Button } from "@openstatus/ui/components/ui/button";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@openstatus/ui/components/ui/card";

export type MonitorStatus = "up" | "down" | "degraded";

export interface MonitorStatusCardProps {
  name: string;
  url: string;
  status: MonitorStatus;
  lastCheckedAt: Date | string | number;
  onPause?: () => void;
}

const STATUS_LABELS: Record<MonitorStatus, string> = {
  up: "Up",
  down: "Down",
  degraded: "Degraded",
};

const STATUS_CLASSES: Record<MonitorStatus, string> = {
  up: "border-success text-success",
  down: "border-error text-error",
  degraded: "border-warning text-warning",
};

const STATUS_DOT_CLASSES: Record<MonitorStatus, string> = {
  up: "bg-success",
  down: "bg-error",
  degraded: "bg-warning",
};

function formatLastChecked(value: Date | string | number): string {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "Unknown";
  return date.toLocaleString();
}

export function MonitorStatusCard({
  name,
  url,
  status,
  lastCheckedAt,
  onPause,
}: MonitorStatusCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{name}</CardTitle>
        <CardDescription className="truncate">{url}</CardDescription>
        <CardAction>
          <Badge variant="outline" className={STATUS_CLASSES[status]}>
            <span
              aria-hidden="true"
              className={`size-2 rounded-full ${STATUS_DOT_CLASSES[status]}`}
            />
            {STATUS_LABELS[status]}
          </Badge>
        </CardAction>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">
          Last checked: {formatLastChecked(lastCheckedAt)}
        </p>
      </CardContent>
      <CardFooter>
        <Button variant="outline" size="sm" onClick={onPause}>
          Pause
        </Button>
      </CardFooter>
    </Card>
  );
}
