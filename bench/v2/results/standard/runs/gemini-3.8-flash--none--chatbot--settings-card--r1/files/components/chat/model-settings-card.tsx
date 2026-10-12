"use client";

import { useId, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

export interface ModelSettingsCardProps
  extends Omit<React.ComponentProps<"div">, "title" | "onChange"> {
  title?: React.ReactNode;
  description?: React.ReactNode;
  label?: string;
  apiKey?: string;
  defaultApiKey?: string;
  placeholder?: string;
  status?: string;
  isConnected?: boolean;
  type?: string;
  disabled?: boolean;
  onSave?: (apiKey: string) => void | Promise<void>;
  onChangeApiKey?: (apiKey: string) => void;
}

export function ModelSettingsCard({
  title = "Model Settings",
  description = "Configure your API key to authenticate requests with the model provider.",
  label = "API Key",
  apiKey: controlledApiKey,
  defaultApiKey = "",
  placeholder = "Enter your API key",
  status = "Connected",
  isConnected = true,
  type = "text",
  disabled = false,
  onSave,
  onChangeApiKey,
  className,
  children,
  id,
  ...props
}: ModelSettingsCardProps) {
  const generatedId = useId();
  const inputId = id ?? `model-api-key-${generatedId}`;

  const [internalApiKey, setInternalApiKey] = useState(defaultApiKey);
  const [isSaving, setIsSaving] = useState(false);

  const isControlled = controlledApiKey !== undefined;
  const currentApiKey = isControlled ? controlledApiKey : internalApiKey;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const nextValue = e.target.value;
    if (!isControlled) {
      setInternalApiKey(nextValue);
    }
    onChangeApiKey?.(nextValue);
  };

  const handleSave = async () => {
    if (disabled || isSaving) return;
    if (onSave) {
      try {
        setIsSaving(true);
        await onSave(currentApiKey);
      } finally {
        setIsSaving(false);
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      void handleSave();
    }
  };

  return (
    <div
      data-slot="model-settings-card"
      data-testid="model-settings-card"
      className={cn(
        "flex flex-col gap-6 rounded-2xl border border-border/50 bg-card p-6 text-card-foreground shadow-[var(--shadow-card)]",
        className
      )}
      {...props}
    >
      <div className="flex flex-col gap-1.5">
        <div className="flex items-center justify-between gap-3">
          <h3
            data-slot="card-title"
            data-testid="model-settings-title"
            className="text-base font-semibold tracking-tight text-foreground"
          >
            {title}
          </h3>

          {isConnected && (
            <Badge
              variant="outline"
              data-slot="status-badge"
              data-testid="status-badge"
              className="h-5 gap-1.5 border-emerald-500/20 bg-emerald-500/10 px-2 text-[11px] font-medium text-emerald-600 dark:border-emerald-500/30 dark:bg-emerald-500/15 dark:text-emerald-400"
            >
              <span
                aria-hidden="true"
                className="size-1.5 rounded-full bg-emerald-500"
              />
              {status}
            </Badge>
          )}
        </div>

        {description && (
          <p
            data-slot="card-description"
            data-testid="model-settings-description"
            className="text-sm leading-relaxed text-muted-foreground"
          >
            {description}
          </p>
        )}
      </div>

      <div className="flex flex-col gap-2">
        <Label
          htmlFor={inputId}
          className="text-sm font-medium text-foreground"
        >
          {label}
        </Label>
        <Input
          id={inputId}
          type={type}
          value={currentApiKey}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled || isSaving}
          autoComplete="off"
          spellCheck={false}
          data-testid="api-key-input"
          className="font-mono text-sm"
        />
      </div>

      {children}

      <div className="flex items-center justify-end">
        <Button
          type="button"
          disabled={disabled || isSaving}
          onClick={() => void handleSave()}
          data-testid="save-button"
        >
          {isSaving ? "Saving..." : "Save"}
        </Button>
      </div>
    </div>
  );
}

export default ModelSettingsCard;
