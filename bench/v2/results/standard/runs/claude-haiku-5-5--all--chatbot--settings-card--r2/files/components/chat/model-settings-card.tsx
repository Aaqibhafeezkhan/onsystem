import { useId } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type ModelSettingsCardProps = {
  title: string;
  description: string;
  apiKey: string;
  onApiKeyChange: (value: string) => void;
  onSave: () => void;
};

export function ModelSettingsCard({
  title,
  description,
  apiKey,
  onApiKeyChange,
  onSave,
}: ModelSettingsCardProps) {
  const inputId = useId();

  return (
    <section className="flex flex-col gap-4 rounded-xl border border-border bg-card p-6 text-card-foreground">
      <div className="flex items-start justify-between gap-2">
        <div className="flex flex-col gap-1">
          <h2 className="text-base font-semibold text-foreground">{title}</h2>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>
        <Badge variant="outline" tw="shrink-0 text-chart-2">
          Connected
        </Badge>
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor={inputId}>API key</Label>
        <Input
          id={inputId}
          type="password"
          autoComplete="off"
          placeholder="sk-..."
          value={apiKey}
          onChange={(event) => onApiKeyChange(event.target.value)}
        />
      </div>

      <div className="flex justify-end">
        <Button onClick={onSave}>Save</Button>
      </div>
    </section>
  );
}
