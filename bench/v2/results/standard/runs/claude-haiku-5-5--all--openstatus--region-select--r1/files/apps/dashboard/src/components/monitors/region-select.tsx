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

export const MONITORING_REGIONS = [
  { value: "ams", label: "Amsterdam" },
  { value: "fra", label: "Frankfurt" },
  { value: "iad", label: "Virginia" },
  { value: "sin", label: "Singapore" },
  { value: "syd", label: "Sydney" },
] as const;

export type MonitoringRegion = (typeof MONITORING_REGIONS)[number]["value"];

interface RegionSelectProps {
  value?: MonitoringRegion;
  defaultValue?: MonitoringRegion;
  onValueChange?: (value: MonitoringRegion) => void;
  disabled?: boolean;
  name?: string;
}

export function RegionSelect({
  value,
  defaultValue,
  onValueChange,
  disabled,
  name,
}: RegionSelectProps) {
  const id = useId();
  const helperId = `${id}-helper`;

  return (
    <div className="flex flex-col gap-2">
      <Label htmlFor={id}>Region</Label>
      <Select
        name={name}
        value={value}
        defaultValue={defaultValue}
        onValueChange={(next) => onValueChange?.(next as MonitoringRegion)}
        disabled={disabled}
      >
        <SelectTrigger id={id} className="w-full" aria-describedby={helperId}>
          <SelectValue placeholder="Select a region" />
        </SelectTrigger>
        <SelectContent>
          {MONITORING_REGIONS.map((region) => (
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
