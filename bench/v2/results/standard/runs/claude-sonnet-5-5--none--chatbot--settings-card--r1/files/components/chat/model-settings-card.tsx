"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function ModelSettingsCard() {
  const [apiKey, setApiKey] = useState("");

  return (
    <div className="w-full max-w-md rounded-xl border border-border bg-card p-6 text-card-foreground">
      <div className="flex items-start justify-between gap-2">
        <h3 className="font-semibold text-lg leading-none">Model settings</h3>
        <span className="text-xs font-medium text-green-600 dark:text-green-500">
          Connected
        </span>
      </div>
      <p className="mt-2 text-muted-foreground text-sm">
        Enter the API key used to connect to your model provider.
      </p>
      <form
        className="mt-4 flex flex-col gap-3"
        onSubmit={(e) => e.preventDefault()}
      >
        <Label htmlFor="model-api-key">API key</Label>
        <Input
          id="model-api-key"
          onChange={(e) => setApiKey(e.target.value)}
          placeholder="sk-..."
          type="text"
          value={apiKey}
        />
        <Button className="self-end" type="submit">
          Save
        </Button>
      </form>
    </div>
  );
}
