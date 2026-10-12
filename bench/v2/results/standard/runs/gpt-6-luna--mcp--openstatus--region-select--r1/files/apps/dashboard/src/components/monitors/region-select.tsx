import {
  FormDescription,
} from "@openstatus/ui/components/ui/form";
import { Label } from "@openstatus/ui/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@openstatus/ui/components/ui/select";
import { useId } from "react";

const REGIONS = [
  "Amsterdam",
  "Frankfurt",
  "Virginia",
  "Singapore",
  "Sydney",
] as const;

export type MonitoringRegion = (typeof REGIONS)[number];

type RegionSelectProps = {
  value?: MonitoringRegion;
  defaultValue?: MonitoringRegion;
  onValueChange?: (region: MonitoringRegion) => void;
};

export function RegionSelect({
  value,
  defaultValue = "Amsterdam",
  onValueChange,
}: RegionSelectProps) {
  const id = useId();
  const descriptionId = `${id}-description`;

  return (
    <div className="grid gap-2">
      <Label htmlFor={id}>Monitoring region</Label>
      <Select
        value={value}
        defaultValue={defaultValue}
        onValueChange={(region) => onValueChange?.(region as MonitoringRegion)}
      >
        <SelectTrigger
          id={id}
          className="w-full"
          aria-describedby={descriptionId}
        >
          <SelectValue placeholder="Choose a region" />
        </SelectTrigger>
        <SelectContent>
          {REGIONS.map((region) => (
            <SelectItem key={region} value={region}>
              {region}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <FormDescription id={descriptionId}>
        Choose where your monitor will run its checks.
      </FormDescription>
    </div>
  );
}
