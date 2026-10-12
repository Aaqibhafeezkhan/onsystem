"use client";

import { Label } from "@openstatus/ui/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@openstatus/ui/components/ui/select";
import { useId } from "react";

export const MONITOR_REGIONS = [
  { value: "ams", label: "Amsterdam" },
  { value: "fra", label: "Frankfurt" },
  { value: "iad", label: "Virginia" },
  { value: "sin", label: "Singapore" },
  { value: "syd", label: "Sydney" },
] as const;

export type MonitorRegion = (typeof MONITOR_REGIONS)[number]["value"];

export function RegionSelect({
  value,
  onValueChange,
  label = "Region",
  description = "Choose the region your monitor runs checks from.",
  disabled,
}: {
  value?: MonitorRegion;
  onValueChange?: (value: MonitorRegion) => void;
  label?: string;
  description?: string;
  disabled?: boolean;
}) {
  const id = useId();
  const descriptionId = `${id}-description`;

  return (
    <div className="grid gap-2">
      <Label htmlFor={id}>{label}</Label>
      <Select
        value={value}
        onValueChange={(v) => onValueChange?.(v as MonitorRegion)}
        disabled={disabled}
      >
        <SelectTrigger id={id} className="w-full" aria-describedby={descriptionId}>
          <SelectValue placeholder="Select a region" />
        </SelectTrigger>
        <SelectContent>
          {MONITOR_REGIONS.map((region) => (
            <SelectItem key={region.value} value={region.value}>
              {region.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <p id={descriptionId} className="text-muted-foreground text-sm">
        {description}
      </p>
    </div>
  );
}
