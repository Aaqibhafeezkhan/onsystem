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
import * as React from "react";

import { cn } from "@/lib/utils";

const MONITOR_REGIONS = [
  { code: "ams", name: "Amsterdam" },
  { code: "fra", name: "Frankfurt" },
  { code: "iad", name: "Virginia" },
  { code: "sin", name: "Singapore" },
  { code: "syd", name: "Sydney" },
] as const;

export type RegionSelectProps = {
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  label?: React.ReactNode;
  helperText?: React.ReactNode;
  placeholder?: string;
  disabled?: boolean;
  id?: string;
  className?: string;
};

export function RegionSelect({
  value,
  defaultValue,
  onValueChange,
  label = "Region",
  helperText = "Select the region where your monitor will run checks from.",
  placeholder = "Select a region",
  disabled,
  id,
  className,
}: RegionSelectProps) {
  const generatedId = React.useId();
  const selectId = id ?? generatedId;
  const descriptionId = `${selectId}-description`;

  return (
    <div className={cn("grid gap-2", className)}>
      {label && <Label htmlFor={selectId}>{label}</Label>}
      <Select
        value={value}
        defaultValue={defaultValue}
        onValueChange={onValueChange}
        disabled={disabled}
      >
        <SelectTrigger
          id={selectId}
          className="w-full"
          aria-describedby={helperText ? descriptionId : undefined}
        >
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          {MONITOR_REGIONS.map((region) => {
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
        <p id={descriptionId} className="text-muted-foreground text-xs">
          {helperText}
        </p>
      )}
    </div>
  );
}
