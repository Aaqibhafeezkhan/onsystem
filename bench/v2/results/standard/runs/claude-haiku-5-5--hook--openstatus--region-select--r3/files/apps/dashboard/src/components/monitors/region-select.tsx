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
  { label: "Amsterdam", value: "ams" },
  { label: "Frankfurt", value: "fra" },
  { label: "Virginia", value: "iad" },
  { label: "Singapore", value: "sin" },
  { label: "Sydney", value: "syd" },
] as const;

export type MonitoringRegion = (typeof monitoringRegions)[number]["value"];

interface RegionSelectProps {
  value?: MonitoringRegion;
  defaultValue?: MonitoringRegion;
  onValueChange?: (value: MonitoringRegion) => void;
  name?: string;
  disabled?: boolean;
  label?: string;
  placeholder?: string;
  helperText?: string;
  className?: string;
}

export function RegionSelect({
  value,
  defaultValue,
  onValueChange,
  name,
  disabled,
  label = "Region",
  placeholder = "Select a region",
  helperText = "The region the monitor checks your endpoint from.",
  className,
}: RegionSelectProps) {
  const id = useId();
  const helperId = `${id}-helper`;

  return (
    <div className={cn("grid gap-2", className)}>
      <Label htmlFor={id}>{label}</Label>
      <Select
        name={name}
        value={value}
        defaultValue={defaultValue}
        onValueChange={(next) => onValueChange?.(next as MonitoringRegion)}
        disabled={disabled}
      >
        <SelectTrigger
          id={id}
          className="w-full"
          aria-describedby={helperId}
        >
          <SelectValue placeholder={placeholder} />
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
        {helperText}
      </p>
    </div>
  );
}
