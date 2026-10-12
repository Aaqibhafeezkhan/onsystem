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
  onValueChange?: (value: MonitorRegion) => void;
  defaultValue?: MonitorRegion;
  disabled?: boolean;
  id?: string;
  label?: string;
  helperText?: string;
  placeholder?: string;
  className?: string;
}

export function RegionSelect({
  value,
  onValueChange,
  defaultValue,
  disabled,
  id,
  label = "Region",
  helperText = "The region from which this monitor is checked.",
  placeholder = "Select a region",
  className,
}: RegionSelectProps) {
  const generatedId = useId();
  const triggerId = id ?? `region-select-${generatedId}`;
  const helperId = `${triggerId}-helper`;

  return (
    <div className={className ?? "grid gap-1.5"}>
      <Label htmlFor={triggerId}>{label}</Label>
      <Select
        value={value}
        defaultValue={defaultValue}
        onValueChange={(next) => onValueChange?.(next as MonitorRegion)}
        disabled={disabled}
      >
        <SelectTrigger
          id={triggerId}
          className="w-full"
          aria-describedby={helperId}
        >
          <SelectValue placeholder={placeholder} />
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
        {helperText}
      </p>
    </div>
  );
}
