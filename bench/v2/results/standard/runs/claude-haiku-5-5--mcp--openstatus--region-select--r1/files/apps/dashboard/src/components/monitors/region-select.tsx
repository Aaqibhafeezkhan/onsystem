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

interface RegionSelectProps {
  value?: MonitorRegion;
  defaultValue?: MonitorRegion;
  onValueChange?: (value: MonitorRegion) => void;
  disabled?: boolean;
  name?: string;
  required?: boolean;
}

export function RegionSelect({
  value,
  defaultValue,
  onValueChange,
  disabled,
  name,
  required,
}: RegionSelectProps) {
  const id = useId();
  const helperId = `${id}-helper`;

  return (
    <div className="grid gap-1.5">
      <Label htmlFor={id}>Monitoring region</Label>
      <Select
        value={value}
        defaultValue={defaultValue}
        onValueChange={(next) => onValueChange?.(next as MonitorRegion)}
        disabled={disabled}
        name={name}
        required={required}
      >
        <SelectTrigger id={id} size="sm" aria-describedby={helperId}>
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
      <p id={helperId} className="text-muted-foreground text-xs">
        Checks run from this location. Choose the region closest to your users.
      </p>
    </div>
  );
}
