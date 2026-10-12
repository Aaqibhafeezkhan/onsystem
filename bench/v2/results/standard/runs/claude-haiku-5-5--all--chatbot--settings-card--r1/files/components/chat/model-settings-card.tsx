import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";

export function ModelSettingsCard() {
  return (
    <section className="flex flex-col gap-4 rounded-xl border border-border bg-card p-6 text-card-foreground">
      <div className="flex flex-col gap-1">
        <div className="flex items-center justify-between gap-2">
          <h2 className="font-medium text-base text-foreground">
            Model settings
          </h2>
          <Badge className="text-chart-2" variant="outline">
            Connected
          </Badge>
        </div>
        <p className="text-sm text-muted-foreground">
          Enter the API key used to connect to your model provider.
        </p>
      </div>

      <form className="flex flex-col gap-4">
        <div className="flex flex-col gap-2">
          <Label className="font-normal text-muted-foreground" htmlFor="model-api-key">
            API key
          </Label>
          <div className="flex items-center gap-2">
            <Input
              autoComplete="off"
              className="h-10 rounded-lg text-sm"
              id="model-api-key"
              name="apiKey"
              placeholder="sk-..."
              type="password"
            />
            <Button className="h-10" type="submit">
              Save
            </Button>
          </div>
        </div>
      </form>
    </section>
  );
}
