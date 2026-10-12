"use client";

import { Label } from "@openstatus/ui/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@openstatus/ui/components/ui/select";
import { useId, type ComponentProps } from "react";

type RegionSelectProps = Pick<
  ComponentProps<typeof Select>,
  "value" | "defaultValue" | "onValueChange" | "disabled" | "name"
>;

const regions = [
  { value: "ams", label: "Amsterdam" },
  { value: "fra", label: "Frankfurt" },
  { value: "iad", label: "Virginia" },
  { value: "sin", label: "Singapore" },
  { value: "syd", label: "Sydney" },
] as const;

export function RegionSelect(props: RegionSelectProps) {
  const id = useId();
  const descriptionId = `${id}-description`;

  return (
    <div className="grid gap-2">
      <Label htmlFor={id}>Monitoring region</Label>
      <Select defaultValue="ams" {...props}>
        <SelectTrigger
          id={id}
          aria-describedby={descriptionId}
          className="w-full"
        >
          <SelectValue placeholder="Choose a region" />
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
        Checks run from this location, so choose the region closest to your
        users.
      </p>
    </div>
  );
}
