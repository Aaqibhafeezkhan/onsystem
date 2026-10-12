"use client";

import { Label } from "@openstatus/ui/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@openstatus/ui/components/ui/select";
import { cn } from "@openstatus/ui/lib/utils";
import { useId } from "react";

export const monitoringRegions = [
  { value: "ams", label: "Amsterdam" },
  { value: "fra", label: "Frankfurt" },
  { value: "iad", label: "Virginia" },
  { value: "sin", label: "Singapore" },
  { value: "syd", label: "Sydney" },
] as const;

export type MonitoringRegion = (typeof monitoringRegions)[number]["value"];

interface RegionSelectProps {
  id?: string;
  name?: string;
  value?: MonitoringRegion;
  defaultValue?: MonitoringRegion;
  onValueChange?: (value: MonitoringRegion) => void;
  disabled?: boolean;
  className?: string;
}

export function RegionSelect({
  id,
  name,
  value,
  defaultValue,
  onValueChange,
  disabled,
  className,
}: RegionSelectProps) {
  const generatedId = useId();
  const triggerId = id ?? `region-select-${generatedId}`;
  const helperId = `${triggerId}-description`;

  return (
    <div className={cn("grid gap-2", className)}>
      <Label htmlFor={triggerId} className={cn(disabled && "opacity-50")}>
        Region
      </Label>
      <Select
        name={name}
        value={value}
        defaultValue={defaultValue}
        onValueChange={(next) => onValueChange?.(next as MonitoringRegion)}
        disabled={disabled}
      >
        <SelectTrigger
          id={triggerId}
          className="w-full"
          aria-describedby={helperId}
        >
          <SelectValue placeholder="Select a region" />
        </SelectTrigger>
        <SelectContent>
          {monitoringRegions.map((region) => (
            <SelectItem key={region.value} value={region.value}>
              {region.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <p id={helperId} className="text-muted-foreground text-sm">
        Checks are run from this location. Pick the region closest to your
        users or the service you monitor.
      </p>
    </div>
  );
}
