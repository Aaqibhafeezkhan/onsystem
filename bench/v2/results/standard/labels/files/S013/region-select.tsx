"use client";

import { Label } from "@openstatus/ui/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@openstatus/ui/components/ui/select";
import { type ComponentProps, useId } from "react";

const regions = [
  { value: "ams", label: "Amsterdam" },
  { value: "fra", label: "Frankfurt" },
  { value: "iad", label: "Virginia" },
  { value: "sin", label: "Singapore" },
  { value: "syd", label: "Sydney" },
];

type RegionSelectProps = Omit<ComponentProps<typeof Select>, "children">;

export function RegionSelect(props: RegionSelectProps) {
  const id = useId();
  const descriptionId = `${id}-description`;

  return (
    <div className="grid gap-2">
      <Label htmlFor={id}>Monitoring region</Label>
      <Select {...props}>
        <SelectTrigger
          id={id}
          aria-describedby={descriptionId}
          className="w-full"
        >
          <SelectValue placeholder="Select a region" />
        </SelectTrigger>
        <SelectContent>
          {regions.map((region) => (
            <SelectItem key={region.value} value={region.value}>
              {region.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <p id={descriptionId} className="text-muted-foreground text-sm">
        Choose the region from which your monitor checks your endpoint.
      </p>
    </div>
  );
}
