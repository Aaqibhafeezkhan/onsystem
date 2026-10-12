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

export type Region = (typeof REGIONS)[number]["value"];

interface RegionSelectProps {
  value?: Region;
  onValueChange?: (value: Region) => void;
  label?: string;
  description?: string;
  disabled?: boolean;
}

export function RegionSelect({
  value,
  onValueChange,
  label = "Region",
  description = "The region your monitor will run its checks from.",
  disabled,
}: RegionSelectProps) {
  const id = useId();
  const descriptionId = `${id}-description`;

  return (
    <div className="grid gap-2">
      <Label htmlFor={id}>{label}</Label>
      <Select
        value={value}
        onValueChange={(v) => onValueChange?.(v as Region)}
        disabled={disabled}
      >
        <SelectTrigger
          id={id}
          className="w-full"
          aria-describedby={descriptionId}
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
      <p id={descriptionId} className="text-muted-foreground text-sm">
        {description}
      </p>
    </div>
  );
}
