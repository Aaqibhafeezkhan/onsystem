"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function ModelSettingsCard() {
  const [apiKey, setApiKey] = useState("");

  return (
    <div className="flex w-full max-w-md flex-col gap-4 rounded-xl border border-border bg-card p-6 text-card-foreground">
      <div className="flex flex-col gap-1">
        <div className="flex items-center justify-between gap-2">
          <h3 className="font-semibold text-base">Model settings</h3>
          <span className="font-medium text-chart-2 text-xs">
            Connected
          </span>
        </div>
        <p className="text-muted-foreground text-sm">
          Provide the API key used to connect to your model provider.
        </p>
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="model-api-key">API key</Label>
        <Input
          id="model-api-key"
          onChange={(e) => setApiKey(e.target.value)}
          placeholder="Enter your API key"
          type="text"
          value={apiKey}
        />
      </div>
      <div className="flex justify-end">
        <Button type="button">Save</Button>
      </div>
    </div>
  );
}
