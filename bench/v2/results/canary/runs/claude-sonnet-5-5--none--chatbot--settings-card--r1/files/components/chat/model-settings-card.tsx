"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function ModelSettingsCard() {
  const [apiKey, setApiKey] = useState("");

  return (
    <div className="flex w-full max-w-md flex-col gap-4 rounded-xl border border-border bg-card p-6 text-card-foreground">
      <div className="flex items-start justify-between gap-2">
        <div className="flex flex-col gap-1">
          <h3 className="font-semibold text-base leading-none">
            Model settings
          </h3>
          <p className="text-muted-foreground text-sm">
            Configure the API key used to connect to your model provider.
          </p>
        </div>
        <span className="text-green-600 text-xs font-medium">Connected</span>
      </div>
      <form
        className="flex flex-col gap-3"
        onSubmit={(e) => e.preventDefault()}
      >
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
        <Button className="self-end" type="submit">
          Save
        </Button>
      </form>
    </div>
  );
}
