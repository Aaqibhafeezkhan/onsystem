import { useId, type ComponentProps } from "react";

import { Label } from "@openstatus/ui/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@openstatus/ui/components/ui/select";

type RegionSelectProps = Omit<ComponentProps<typeof Select>, "children"> & {
  id?: string;
};

const REGIONS = [
  { value: "ams", label: "Amsterdam" },
  { value: "fra", label: "Frankfurt" },
  { value: "iad", label: "Virginia" },
  { value: "sin", label: "Singapore" },
  { value: "syd", label: "Sydney" },
] as const;

export function RegionSelect({ id, ...selectProps }: RegionSelectProps) {
  const generatedId = useId();
  const selectId = id ?? generatedId;

  return (
    <div className="grid gap-2">
      <Label htmlFor={selectId}>Monitoring region</Label>
      <Select {...selectProps}>
        <SelectTrigger id={selectId} className="w-full">
          <SelectValue placeholder="Choose a region" />
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
        Choose where this monitor will run its checks from.
      </p>
    </div>
  );
}
