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

export const MONITORING_REGIONS = [
  { value: "ams", label: "Amsterdam" },
  { value: "fra", label: "Frankfurt" },
  { value: "iad", label: "Virginia" },
  { value: "sin", label: "Singapore" },
  { value: "syd", label: "Sydney" },
] as const;

export type MonitoringRegion = (typeof MONITORING_REGIONS)[number]["value"];

interface RegionSelectProps {
  id?: string;
  name?: string;
  label?: string;
  description?: string;
  placeholder?: string;
  value?: MonitoringRegion;
  defaultValue?: MonitoringRegion;
  onValueChange?: (value: MonitoringRegion) => void;
  disabled?: boolean;
  required?: boolean;
  className?: string;
}

export function RegionSelect({
  id,
  name,
  label = "Region",
  description = "The region from which this monitor runs its checks.",
  placeholder = "Select a region",
  value,
  defaultValue,
  onValueChange,
  disabled,
  required,
  className,
}: RegionSelectProps) {
  const generatedId = useId();
  const triggerId = id ?? generatedId;
  const descriptionId = `${triggerId}-description`;

  return (
    <div className={cn("grid w-full gap-2", className)}>
      <Label htmlFor={triggerId}>{label}</Label>
      <Select
        name={name}
        value={value}
        defaultValue={defaultValue}
        onValueChange={(next) => onValueChange?.(next as MonitoringRegion)}
        disabled={disabled}
        required={required}
      >
        <SelectTrigger
          id={triggerId}
          className="w-full"
          aria-describedby={descriptionId}
        >
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          {MONITORING_REGIONS.map((region) => (
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
