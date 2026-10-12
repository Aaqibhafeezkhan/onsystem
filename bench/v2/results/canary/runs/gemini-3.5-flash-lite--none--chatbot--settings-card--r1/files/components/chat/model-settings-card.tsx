"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

export interface ModelSettingsCardProps {
  title?: string;
  description?: string;
  initialApiKey?: string;
  onSave?: (apiKey: string) => void;
  className?: string;
}

export function ModelSettingsCard({
  title = "Model Settings",
  description = "Configure your AI model API key and provider settings.",
  initialApiKey = "",
  onSave,
  className,
}: ModelSettingsCardProps) {
  const [apiKey, setApiKey] = useState(initialApiKey);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    onSave?.(apiKey);
  };

  return (
    <div
      className={cn(
        "flex flex-col gap-5 rounded-xl border border-border/50 bg-card p-6 shadow-[var(--shadow-card)] text-card-foreground",
        className
      )}
    >
      <div className="flex flex-col gap-1.5">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-base leading-none tracking-tight">
            {title}
          </h3>
          <div className="flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-2.5 py-1 text-emerald-600 dark:text-emerald-400 text-xs font-medium">
            <span className="size-1.5 rounded-full bg-emerald-500" />
            Connected
          </div>
        </div>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>

      <form onSubmit={handleSave} className="flex flex-col gap-4">
        <div className="flex flex-col gap-2">
          <Label
            className="font-normal text-muted-foreground text-xs"
            htmlFor="api-key"
          >
            API Key
          </Label>
          <Input
            id="api-key"
            type="password"
            placeholder="sk-..."
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
          />
        </div>

        <div className="flex justify-end">
          <Button type="submit" size="sm">
            Save
          </Button>
        </div>
      </form>
    </div>
  );
}
