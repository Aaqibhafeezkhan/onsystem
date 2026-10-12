"use client";

import { getRegionInfo } from "@openstatus/regions";
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

const REGIONS = [
  { code: "ams", name: "Amsterdam" },
  { code: "fra", name: "Frankfurt" },
  { code: "iad", name: "Virginia" },
  { code: "sin", name: "Singapore" },
  { code: "syd", name: "Sydney" },
] as const;

export interface RegionSelectProps extends React.ComponentProps<typeof Select> {
  label?: string;
  helperText?: React.ReactNode;
  placeholder?: string;
  className?: string;
  id?: string;
}

export function RegionSelect({
  label = "Region",
  helperText = "Select the region where your monitor will run checks.",
  placeholder = "Select a region",
  className,
  id = "region-select",
  ...props
}: RegionSelectProps) {
  const selectId = React.useId();
  const triggerId = id || selectId;

  return (
    <div className={cn("grid gap-2", className)}>
      <Label htmlFor={triggerId}>{label}</Label>
      <Select {...props}>
        <SelectTrigger id={triggerId} className="w-full">
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          {REGIONS.map((region) => {
            const info = getRegionInfo(region.code);
            return (
              <SelectItem key={region.code} value={region.code}>
                <span className="flex items-center gap-2">
                  <span aria-hidden="true">{info.flag}</span>
                  <span>{region.name}</span>
                </span>
              </SelectItem>
            );
          })}
        </SelectContent>
      </Select>
      {helperText && (
        <p className="text-muted-foreground text-xs">{helperText}</p>
      )}
    </div>
  );
}
