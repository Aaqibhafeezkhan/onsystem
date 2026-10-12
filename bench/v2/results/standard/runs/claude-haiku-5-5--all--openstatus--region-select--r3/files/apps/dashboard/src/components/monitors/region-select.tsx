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
  name?: string;
  disabled?: boolean;
  required?: boolean;
}

export function RegionSelect({
  value,
  defaultValue,
  onValueChange,
  name,
  disabled,
  required,
}: RegionSelectProps) {
  const id = useId();
  const helperId = `${id}-helper`;

  return (
    <div className="flex flex-col gap-2">
      <Label htmlFor={id}>Monitoring region</Label>
      <Select
        name={name}
        value={value}
        defaultValue={defaultValue}
        onValueChange={(next) => onValueChange?.(next as MonitorRegion)}
        disabled={disabled}
        required={required}
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
        The region the monitor checks your endpoint from.
      </p>
    </div>
  );
}
