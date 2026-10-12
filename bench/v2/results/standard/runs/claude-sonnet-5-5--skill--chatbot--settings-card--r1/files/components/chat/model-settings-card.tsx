"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function ModelSettingsCard({
  onSave,
}: {
  onSave?: (apiKey: string) => void;
}) {
  const [apiKey, setApiKey] = useState("");

  return (
    <div className="flex w-full max-w-md flex-col gap-4 rounded-xl border border-border bg-card p-6 text-card-foreground shadow-[var(--shadow-card)]">
      <div className="flex items-start justify-between gap-2">
        <div className="flex flex-col gap-1">
          <h3 className="text-base font-semibold">Model settings</h3>
          <p className="text-sm text-muted-foreground">
            Provide the API key used to connect to your model provider.
          </p>
        </div>
        <Badge
          variant="outline"
          className="text-green-600 dark:text-green-400"
        >
          Connected
        </Badge>
      </div>
      <form
        className="flex flex-col gap-3"
        onSubmit={(event) => {
          event.preventDefault();
          onSave?.(apiKey);
        }}
      >
        <div className="flex flex-col gap-2">
          <Label htmlFor="model-api-key">API key</Label>
          <Input
            id="model-api-key"
            type="text"
            autoComplete="off"
            placeholder="sk-..."
            value={apiKey}
            onChange={(event) => setApiKey(event.target.value)}
          />
        </div>
        <Button type="submit" className="self-end">
          Save
        </Button>
      </form>
    </div>
  );
}
