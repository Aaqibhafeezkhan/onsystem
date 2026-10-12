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

const REGIONS = [
  { value: "ams", label: "Amsterdam" },
  { value: "fra", label: "Frankfurt" },
  { value: "iad", label: "Virginia" },
  { value: "sin", label: "Singapore" },
  { value: "syd", label: "Sydney" },
] as const;

export type MonitorRegion = (typeof REGIONS)[number]["value"];

export function RegionSelect({
  value,
  defaultValue,
  onValueChange,
  disabled,
  label = "Region",
  helperText = "The region from which this monitor will be checked.",
  className,
}: {
  value?: MonitorRegion;
  defaultValue?: MonitorRegion;
  onValueChange?: (value: MonitorRegion) => void;
  disabled?: boolean;
  label?: string;
  helperText?: string;
  className?: string;
}) {
  const id = useId();
  const helperId = `${id}-helper`;

  return (
    <div className={cn("grid gap-2", className)}>
      <Label htmlFor={id}>{label}</Label>
      <Select
        value={value}
        defaultValue={defaultValue}
        onValueChange={(next) => onValueChange?.(next as MonitorRegion)}
        disabled={disabled}
      >
        <SelectTrigger
          id={id}
          size="sm"
          className="w-full"
          aria-describedby={helperId}
        >
          <SelectValue placeholder="Select a region" />
        </SelectTrigger>
        <SelectContent>
          {REGIONS.map((region) => (
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
