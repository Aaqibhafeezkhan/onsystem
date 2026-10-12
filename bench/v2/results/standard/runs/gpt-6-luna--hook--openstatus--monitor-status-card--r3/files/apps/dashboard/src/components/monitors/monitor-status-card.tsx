import { Button } from "@openstatus/ui/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@openstatus/ui/components/ui/card";

import { StatusBadge } from "@/components/common/status-badge";

type MonitorStatus = "up" | "down" | "degraded" | "active" | "error";

export type MonitorStatusCardProps = {
  name: string;
  url: string;
  status: MonitorStatus;
  lastCheckedAt: Date | string | null;
  onPause?: () => void;
};

const statusPresentation = {
  up: { label: "Up", variant: "success" },
  active: { label: "Up", variant: "success" },
  down: { label: "Down", variant: "destructive" },
  error: { label: "Down", variant: "destructive" },
  degraded: { label: "Degraded", variant: "warning" },
} as const;

function formatLastChecked(value: Date | string | null) {
  if (!value) return null;

  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return { text: value.toString() };

  return {
    text: date.toLocaleString(),
    dateTime: date.toISOString(),
  };
}

export function MonitorStatusCard({
  name,
  url,
  status,
  lastCheckedAt,
  onPause,
}: MonitorStatusCardProps) {
  const presentation = statusPresentation[status];
  const lastChecked = formatLastChecked(lastCheckedAt);

  return (
    <Card className="gap-4 py-4 shadow-none">
      <CardHeader className="flex-row items-start justify-between gap-4 px-4">
        <div className="min-w-0 space-y-1">
          <CardTitle className="truncate text-base">{name}</CardTitle>
          <a
            href={url}
            target="_blank"
            rel="noreferrer"
            className="block truncate text-sm text-muted-foreground underline-offset-4 hover:underline"
          >
            {url}
          </a>
        </div>
        <StatusBadge variant={presentation.variant}>{presentation.label}</StatusBadge>
      </CardHeader>
      <CardContent className="px-4">
        <p className="text-sm text-muted-foreground">
          Last checked: {lastChecked ? (
            <time dateTime={lastChecked.dateTime}>{lastChecked.text}</time>
          ) : (
            "Never"
          )}
        </p>
      </CardContent>
      <CardFooter className="justify-end px-4">
        <Button type="button" variant="outline" size="sm" onClick={onPause}>
          Pause
        </Button>
      </CardFooter>
    </Card>
  );
}
