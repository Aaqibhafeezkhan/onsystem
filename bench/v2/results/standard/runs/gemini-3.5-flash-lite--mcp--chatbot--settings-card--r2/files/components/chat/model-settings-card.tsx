import * as React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export interface ModelSettingsCardProps extends React.ComponentProps<"div"> {
  title?: string;
  description?: string;
  apiKey?: string;
  onApiKeyChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onSave?: (e: React.MouseEvent<HTMLButtonElement>) => void;
  isConnected?: boolean;
}

export function ModelSettingsCard({
  title = "Model Settings",
  description = "Configure your API key and connection settings.",
  apiKey = "",
  onApiKeyChange,
  onSave,
  isConnected = true,
  className,
  ...props
}: ModelSettingsCardProps) {
  return (
    <div
      data-slot="model-settings-card"
      className={cn(
        "rounded-xl border border-border/50 bg-card p-6 shadow-[var(--shadow-card)] text-card-foreground flex flex-col gap-4",
        className
      )}
      {...props}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h3 className="font-semibold text-base text-foreground">{title}</h3>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>
        {isConnected && (
          <Badge
            variant="outline"
            className="gap-1.5 bg-chart-2/15 text-chart-2 border-chart-2/30"
          >
            <span className="size-1.5 rounded-full bg-chart-2 animate-pulse" />
            Connected
          </Badge>
        )}
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="api-key" className="text-sm font-medium text-foreground">
          API Key
        </Label>
        <Input
          id="api-key"
          type="password"
          placeholder="Enter your API key..."
          value={apiKey}
          onChange={onApiKeyChange}
        />
      </div>

      <div className="flex justify-end">
        <Button onClick={onSave} size="sm">
          Save
        </Button>
      </div>
    </div>
  );
}
