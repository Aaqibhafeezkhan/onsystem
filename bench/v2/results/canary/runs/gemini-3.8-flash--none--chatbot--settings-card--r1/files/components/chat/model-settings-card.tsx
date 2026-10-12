"use client";

import {
  type ComponentProps,
  type FormEvent,
  type ReactNode,
  useState,
} from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

export type ModelSettingsCardProps = {
  title?: ReactNode;
  description?: ReactNode;
  apiKey?: string;
  value?: string;
  defaultApiKey?: string;
  defaultValue?: string;
  onApiKeyChange?: (value: string) => void;
  onSave?: (apiKey: string) => void | Promise<void>;
  statusLabel?: ReactNode;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  children?: ReactNode;
} & Omit<ComponentProps<"div">, "title" | "defaultValue">;

export function ModelSettingsCard({
  title = "Model Settings",
  description = "Configure your API key and connection settings for this model.",
  apiKey,
  value,
  defaultApiKey,
  defaultValue = "",
  onApiKeyChange,
  onSave,
  statusLabel = "Connected",
  placeholder = "Enter your API key",
  disabled = false,
  className,
  children,
  ...props
}: ModelSettingsCardProps) {
  const [internalKey, setInternalKey] = useState(defaultApiKey ?? defaultValue);
  const [isSaving, setIsSaving] = useState(false);

  const currentApiKey = apiKey ?? value ?? internalKey;

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const nextValue = event.target.value;
    if (apiKey === undefined && value === undefined) {
      setInternalKey(nextValue);
    }
    onApiKeyChange?.(nextValue);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!onSave || disabled || isSaving) {
      return;
    }

    try {
      setIsSaving(true);
      await onSave(currentApiKey);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div
      className={cn(
        "flex flex-col gap-6 rounded-xl border border-border/60 bg-card p-6 text-card-foreground shadow-[var(--shadow-card)]",
        className
      )}
      {...props}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex flex-col gap-1.5">
          <h3 className="text-base font-semibold leading-none tracking-tight text-foreground">
            {title}
          </h3>
          <p className="text-sm leading-normal text-muted-foreground">
            {description}
          </p>
        </div>
        {statusLabel ? (
          <Badge
            className="gap-1.5 border-green-500/20 bg-green-500/10 text-xs font-medium text-green-600 dark:border-green-500/30 dark:bg-green-500/20 dark:text-green-400"
            variant="outline"
          >
            <span
              aria-hidden="true"
              className="size-1.5 rounded-full bg-green-500"
            />
            {statusLabel}
          </Badge>
        ) : null}
      </div>

      <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
        <div className="flex flex-col gap-2">
          <Label className="text-sm font-medium text-foreground" htmlFor="api-key">
            API Key
          </Label>
          <Input
            autoComplete="off"
            className="h-10 rounded-lg border-border/60 bg-input/30 text-sm focus:border-foreground/20"
            disabled={disabled || isSaving}
            id="api-key"
            name="apiKey"
            onChange={handleInputChange}
            placeholder={placeholder}
            spellCheck={false}
            type="text"
            value={currentApiKey}
          />
        </div>

        <div className="flex items-center justify-end">
          <Button
            disabled={disabled || isSaving}
            size="sm"
            type="submit"
          >
            Save
          </Button>
        </div>
      </form>

      {children}
    </div>
  );
}

export default ModelSettingsCard;
