"use client";

import * as React from "react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

export interface ModelSettingsCardProps extends React.ComponentProps<"div"> {
  title?: string;
  description?: string;
  defaultApiKey?: string;
  onSave?: (apiKey: string) => void | Promise<void>;
}

export function ModelSettingsCard({
  title = "Model Settings",
  description = "Configure your AI model API key to connect and generate responses.",
  defaultApiKey = "",
  onSave,
  className,
  ...props
}: ModelSettingsCardProps) {
  const [apiKey, setApiKey] = useState(defaultApiKey);
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (onSave) {
      try {
        setIsSaving(true);
        await onSave(apiKey);
      } finally {
        setIsSaving(false);
      }
    }
  };

  return (
    <div
      className={cn(
        "flex flex-col gap-5 rounded-xl border border-border/50 bg-card p-6 shadow-[var(--shadow-card)] text-card-foreground",
        className
      )}
      {...props}
    >
      <div className="flex flex-col gap-1.5">
        <div className="flex items-center justify-between gap-2">
          <h3 className="text-base font-semibold text-foreground tracking-tight">
            {title}
          </h3>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-green-500/10 px-2.5 py-0.5 text-xs font-medium text-green-600 dark:text-green-400">
            <span className="size-1.5 rounded-full bg-green-600 dark:bg-green-400" />
            Connected
          </span>
        </div>
        {description && (
          <p className="text-sm text-muted-foreground leading-relaxed">
            {description}
          </p>
        )}
      </div>

      <form onSubmit={handleSave} className="flex flex-col gap-4">
        <div className="flex flex-col gap-2">
          <Label className="font-normal text-muted-foreground" htmlFor="api-key">
            API Key
          </Label>
          <Input
            id="api-key"
            type="password"
            placeholder="sk-..."
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            className="h-10 rounded-lg border-border/50 bg-muted/50 text-sm transition-colors focus:border-foreground/20 focus:bg-muted"
          />
        </div>

        <div className="flex items-center justify-end gap-3 pt-1">
          <Button type="submit" disabled={isSaving} size="sm">
            {isSaving ? "Saving..." : "Save"}
          </Button>
        </div>
      </form>
    </div>
  );
}
