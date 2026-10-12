"use client";

import * as React from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { CheckCircleFillIcon } from "./icons";

export interface ModelSettingsCardProps extends React.ComponentProps<"div"> {
  title?: string;
  description?: string;
  defaultValue?: string;
  value?: string;
  onChange?: (value: string) => void;
  onSave?: (value: string) => void;
  isConnected?: boolean;
}

export function ModelSettingsCard({
  title = "Model API Key",
  description = "Enter your API key to connect and use AI models.",
  defaultValue = "",
  value,
  onChange,
  onSave,
  isConnected = true,
  className,
  ...props
}: ModelSettingsCardProps) {
  const [internalValue, setInternalValue] = React.useState(defaultValue);
  const currentInputValue = value !== undefined ? value : internalValue;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    if (value === undefined) {
      setInternalValue(newValue);
    }
    onChange?.(newValue);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    onSave?.(currentInputValue);
  };

  return (
    <div
      className={cn(
        "rounded-xl border border-border/50 bg-card p-6 shadow-[var(--shadow-card)] text-card-foreground flex flex-col gap-4",
        className
      )}
      {...props}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h3 className="font-semibold text-lg text-foreground">{title}</h3>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>
        {isConnected && (
          <Badge variant="secondary" className="gap-1.5 text-xs font-medium text-chart-2 bg-chart-2/10 shrink-0">
            <CheckCircleFillIcon className="size-3.5" />
            Connected
          </Badge>
        )}
      </div>

      <form onSubmit={handleSave} className="flex flex-col gap-4">
        <div className="flex flex-col gap-2">
          <Label className="text-sm font-medium text-foreground" htmlFor="api-key-input">
            API Key
          </Label>
          <Input
            id="api-key-input"
            type="password"
            placeholder="sk-..."
            value={currentInputValue}
            onChange={handleChange}
            autoComplete="off"
          />
        </div>
        <div className="flex justify-end">
          <Button type="submit">Save</Button>
        </div>
      </form>
    </div>
  );
}
