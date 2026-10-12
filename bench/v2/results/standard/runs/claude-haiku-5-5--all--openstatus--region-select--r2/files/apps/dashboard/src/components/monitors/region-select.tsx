"use client";

import { Label } from "@openstatus/ui/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@openstatus/ui/components/ui/select";
import { useId, useState } from "react";

export const MONITOR_REGIONS = [
  { value: "ams", label: "Amsterdam" },
  { value: "fra", label: "Frankfurt" },
  { value: "iad", label: "Virginia" },
  { value: "sin", label: "Singapore" },
  { value: "syd", label: "Sydney" },
] as const;

export type MonitorRegion = (typeof MONITOR_REGIONS)[number]["value"];

interface RegionSelectProps {
  value?: MonitorRegion;
  defaultValue?: MonitorRegion;
  onValueChange?: (value: MonitorRegion) => void;
  name?: string;
  disabled?: boolean;
}

export function RegionSelect({
  value,
  defaultValue = "ams",
  onValueChange,
  name,
  disabled,
}: RegionSelectProps) {
  const id = useId();
  const helperId = `${id}-helper`;
  const [internalValue, setInternalValue] = useState<MonitorRegion>(defaultValue);
  const currentValue = value ?? internalValue;

  return (
    <div className="grid gap-2">
      <Label htmlFor={id}>Monitoring region</Label>
      <Select
        name={name}
        disabled={disabled}
        value={currentValue}
        onValueChange={(next) => {
          const region = next as MonitorRegion;
          setInternalValue(region);
          onValueChange?.(region);
        }}
      >
        <SelectTrigger id={id} aria-describedby={helperId} className="w-full">
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
      <p id={helperId} className="text-muted-foreground text-sm">
        Checks run from the selected region. Choose the region closest to your users.
      </p>
    </div>
  );
}
