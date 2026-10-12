import { Label } from "@openstatus/ui/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@openstatus/ui/components/ui/select";

const REGIONS = [
  { value: "ams", label: "Amsterdam" },
  { value: "fra", label: "Frankfurt" },
  { value: "iad", label: "Virginia" },
  { value: "sin", label: "Singapore" },
  { value: "syd", label: "Sydney" },
] as const;

type RegionSelectProps = {
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
};

export function RegionSelect({
  value,
  defaultValue,
  onValueChange,
}: RegionSelectProps) {
  return (
    <div className="grid gap-2">
      <Label htmlFor="monitoring-region">Monitoring region</Label>
      <Select
        value={value}
        defaultValue={defaultValue}
        onValueChange={onValueChange}
      >
        <SelectTrigger id="monitoring-region" className="w-full">
          <SelectValue placeholder="Select a region" />
        </SelectTrigger>
        <SelectContent>
          {REGIONS.map((region) => (
            <SelectItem key={region.value} value={region.value}>
              {region.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <p className="text-muted-foreground text-sm">
        Choose where your monitor checks will run.
      </p>
    </div>
  );
}
