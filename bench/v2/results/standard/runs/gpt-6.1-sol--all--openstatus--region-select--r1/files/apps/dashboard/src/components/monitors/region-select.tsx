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
  { value: "amsterdam", label: "Amsterdam" },
  { value: "frankfurt", label: "Frankfurt" },
  { value: "virginia", label: "Virginia" },
  { value: "singapore", label: "Singapore" },
  { value: "sydney", label: "Sydney" },
] as const;

export function RegionSelect(props: ComponentProps<typeof Select>) {
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
        Choose the region from which your monitor will run its checks.
      </p>
    </div>
  );
}
