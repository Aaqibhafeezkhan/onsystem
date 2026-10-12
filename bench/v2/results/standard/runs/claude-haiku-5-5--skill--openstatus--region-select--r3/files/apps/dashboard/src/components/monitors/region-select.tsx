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

interface RegionSelectProps {
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  name?: string;
  disabled?: boolean;
}

export function RegionSelect({
  value,
  defaultValue,
  onValueChange,
  name,
  disabled,
}: RegionSelectProps) {
  const id = useId();
  const triggerId = `${id}-region`;
  const helperId = `${id}-region-helper`;

  return (
    <div className="grid gap-2">
      <Label htmlFor={triggerId}>Region</Label>
      <Select
        name={name}
        value={value}
        defaultValue={defaultValue}
        onValueChange={onValueChange}
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
          {MONITORING_REGIONS.map((region) => (
            <SelectItem key={region.value} value={region.value}>
              {region.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <p id={helperId} className="text-muted-foreground text-sm">
        Checks run from this location. Pick the region closest to your users
        for the most representative response times.
      </p>
    </div>
  );
}
