"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@openstatus/ui/components/ui/select";
import { Label } from "@openstatus/ui/components/ui/label";
import { useId } from "react";

const REGIONS = [
  { value: "ams", label: "Amsterdam" },
  { value: "fra", label: "Frankfurt" },
  { value: "iad", label: "Virginia" },
  { value: "sin", label: "Singapore" },
  { value: "syd", label: "Sydney" },
] as const;

export type MonitoringRegion = (typeof REGIONS)[number]["value"];

type RegionSelectProps = {
  value: MonitoringRegion;
  onValueChange: (value: MonitoringRegion) => void;
};

export function RegionSelect({ value, onValueChange }: RegionSelectProps) {
  const id = useId();
  const descriptionId = `${id}-description`;

  return (
    <div className="space-y-2">
      <Label htmlFor={id}>Monitoring region</Label>
      <Select value={value} onValueChange={onValueChange}>
        <SelectTrigger id={id} aria-describedby={descriptionId} className="w-full">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {REGIONS.map((region) => (
            <SelectItem key={region.value} value={region.value}>
              {region.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <p id={descriptionId} className="text-muted-foreground text-sm">
        Choose the region your monitor will run from.
      </p>
    </div>
  );
}
