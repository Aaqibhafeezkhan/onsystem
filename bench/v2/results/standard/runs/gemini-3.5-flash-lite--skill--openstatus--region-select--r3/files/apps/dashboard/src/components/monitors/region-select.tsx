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
import * as React from "react";

export interface RegionSelectProps
  extends React.ComponentPropsWithoutRef<typeof Select> {
  label?: string;
  helperText?: string;
  placeholder?: string;
  className?: string;
  id?: string;
}

const REGIONS = [
  { value: "ams", label: "Amsterdam", flag: "🇳🇱" },
  { value: "fra", label: "Frankfurt", flag: "🇩🇪" },
  { value: "iad", label: "Virginia", flag: "🇺🇸" },
  { value: "sin", label: "Singapore", flag: "🇸🇬" },
  { value: "syd", label: "Sydney", flag: "🇦🇺" },
] as const;

export function RegionSelect({
  label = "Region",
  helperText = "Select the region where your monitor will run from.",
  placeholder = "Select a region",
  className,
  id = "region-select",
  ...props
}: RegionSelectProps) {
  return (
    <div className={cn("grid gap-1.5", className)}>
      <Label htmlFor={id}>{label}</Label>
      <Select {...props}>
        <SelectTrigger id={id} className="w-full">
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          {REGIONS.map((region) => (
            <SelectItem key={region.value} value={region.value}>
              <span className="flex items-center gap-2">
                <span>{region.flag}</span>
                <span>{region.label}</span>
              </span>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {helperText && (
        <p className="text-muted-foreground text-xs">{helperText}</p>
      )}
    </div>
  );
}
