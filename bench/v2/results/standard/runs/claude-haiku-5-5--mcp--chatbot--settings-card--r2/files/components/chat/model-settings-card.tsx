"use client";

import { useId, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function ModelSettingsCard() {
  const inputId = useId();
  const [apiKey, setApiKey] = useState("");

  return (
    <section className="flex w-full max-w-md flex-col gap-4 rounded-xl border border-border bg-card p-4 text-card-foreground">
      <header className="flex flex-col gap-1">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-base font-medium text-foreground">Model settings</h2>
          <span className="inline-flex items-center gap-1.5 text-xs font-medium text-chart-2">
            <span aria-hidden="true" className="size-1.5 rounded-full bg-chart-2" />
            Connected
          </span>
        </div>
        <p className="text-sm text-muted-foreground">
          Enter the API key used to access the language model for your chats.
        </p>
      </header>

      <form
        className="flex flex-col gap-3 sm:flex-row sm:items-end"
        onSubmit={(event) => event.preventDefault()}
      >
        <div className="flex min-w-0 flex-1 flex-col gap-1.5">
          <Label htmlFor={inputId}>API key</Label>
          <Input
            id={inputId}
            type="password"
            autoComplete="off"
            placeholder="sk-..."
            value={apiKey}
            onChange={(event) => setApiKey(event.target.value)}
          />
        </div>
        <Button type="submit" className="sm:shrink-0">
          Save
        </Button>
      </form>
    </section>
  );
}
