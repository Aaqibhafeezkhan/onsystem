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

export const REGIONS = [
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
  helperText?: string;
  disabled?: boolean;
  className?: string;
}

export function RegionSelect({
  value,
  onValueChange,
  label = "Region",
  helperText = "Choose the region your monitor runs checks from.",
  disabled,
  className,
}: RegionSelectProps) {
  const id = useId();
  const helperId = `${id}-helper`;

  return (
    <div className={cn("grid gap-2", className)}>
      <Label htmlFor={id}>{label}</Label>
      <Select
        value={value}
        onValueChange={(v) => onValueChange?.(v as Region)}
        disabled={disabled}
      >
        <SelectTrigger id={id} className="w-full" aria-describedby={helperId}>
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
        {helperText}
      </p>
    </div>
  );
}
