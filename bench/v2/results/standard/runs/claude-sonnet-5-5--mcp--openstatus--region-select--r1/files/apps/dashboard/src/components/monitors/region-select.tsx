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

const REGIONS = [
  { value: "ams", label: "Amsterdam" },
  { value: "fra", label: "Frankfurt" },
  { value: "iad", label: "Virginia" },
  { value: "sin", label: "Singapore" },
  { value: "syd", label: "Sydney" },
] as const;

export function RegionSelect({
  value,
  defaultValue,
  onValueChange,
  disabled,
}: {
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  disabled?: boolean;
}) {
  const id = useId();
  const helperId = `${id}-helper`;

  return (
    <div className="grid gap-2">
      <Label htmlFor={id}>Region</Label>
      <Select
        value={value}
        defaultValue={defaultValue}
        onValueChange={onValueChange}
        disabled={disabled}
      >
        <SelectTrigger id={id} aria-describedby={helperId}>
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
      <p id={helperId} className="text-muted-foreground text-sm">
        Choose the region your monitor will run its checks from.
      </p>
    </div>
  );
}
