"use client";

import { useId } from "react";

import { Label } from "@openstatus/ui/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@openstatus/ui/components/ui/select";

const REGIONS = [
  "Amsterdam",
  "Frankfurt",
  "Virginia",
  "Singapore",
  "Sydney",
] as const;

export type MonitoringRegion = (typeof REGIONS)[number];

interface RegionSelectProps {
  value?: MonitoringRegion;
  onValueChange?: (region: MonitoringRegion) => void;
}

export function RegionSelect({ value, onValueChange }: RegionSelectProps) {
  const id = useId();
  const descriptionId = `${id}-description`;

  return (
    <div className="flex flex-col gap-2">
      <Label htmlFor={id}>Monitoring region</Label>
      <Select
        value={value}
        onValueChange={(region: MonitoringRegion) => onValueChange?.(region)}
      >
        <SelectTrigger id={id} aria-describedby={descriptionId} className="w-full">
          <SelectValue placeholder="Select a region" />
        </SelectTrigger>
        <SelectContent>
          {REGIONS.map((region) => (
            <SelectItem key={region} value={region}>
              {region}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <p id={descriptionId} className="text-muted-foreground text-sm">
        Select the region where this monitor will run its checks.
      </p>
    </div>
  );
}
