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
import type * as React from "react";

const REGIONS = ["ams", "fra", "iad", "sin", "syd"] as const;

export type RegionSelectProps = {
  label?: React.ReactNode;
  helperText?: React.ReactNode;
  placeholder?: string;
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  disabled?: boolean;
  className?: string;
  id?: string;
};

export function RegionSelect({
  label = "Region",
  helperText = "Select the region from which to monitor your target.",
  placeholder = "Select a region",
  value,
  defaultValue,
  onValueChange,
  disabled,
  className,
  id = "region-select",
}: RegionSelectProps) {
  return (
    <div className={cn("grid gap-2", className)}>
      <Label htmlFor={id}>{label}</Label>
      <Select
        value={value}
        defaultValue={defaultValue}
        onValueChange={onValueChange}
        disabled={disabled}
      >
        <SelectTrigger id={id} className="w-full">
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          {REGIONS.map((code) => {
            const info = getRegionInfo(code);
            return (
              <SelectItem key={code} value={code}>
                <div className="flex items-center gap-2">
                  <span aria-hidden="true">{info.flag}</span>
                  <span>{info.location}</span>
                </div>
              </SelectItem>
            );
          })}
        </SelectContent>
      </Select>
      {helperText ? (
        <p className="text-muted-foreground text-xs">{helperText}</p>
      ) : null}
    </div>
  );
}
