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
  id?: string;
  label?: string;
  helperText?: string;
  disabled?: boolean;
  className?: string;
}

export function RegionSelect({
  value,
  defaultValue,
  onValueChange,
  id,
  label = "Monitoring region",
  helperText = "The region the monitor checks your endpoint from.",
  disabled,
  className,
}: RegionSelectProps) {
  const generatedId = useId();
  const selectId = id ?? `region-select-${generatedId}`;
  const helperId = `${selectId}-helper`;

  return (
    <div className={`grid gap-1.5 ${className ?? ""}`.trim()}>
      <Label htmlFor={selectId}>{label}</Label>
      <Select
        value={value}
        defaultValue={defaultValue}
        onValueChange={(next) => onValueChange?.(next as MonitoringRegion)}
        disabled={disabled}
      >
        <SelectTrigger
          id={selectId}
          aria-describedby={helperId}
          className="w-full"
        >
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
        {helperText}
      </p>
    </div>
  );
}
