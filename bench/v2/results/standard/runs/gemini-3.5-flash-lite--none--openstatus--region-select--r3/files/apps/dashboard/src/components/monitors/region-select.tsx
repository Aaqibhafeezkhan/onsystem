"use client";

import * as React from "react";
import { Label } from "@openstatus/ui/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@openstatus/ui/components/ui/select";
import { cn } from "@openstatus/ui/lib/utils";

const REGIONS = [
  { value: "ams", label: "Amsterdam", flag: "🇳🇱" },
  { value: "fra", label: "Frankfurt", flag: "🇩🇪" },
  { value: "iad", label: "Virginia", flag: "🇺🇸" },
  { value: "sin", label: "Singapore", flag: "🇸🇬" },
  { value: "syd", label: "Sydney", flag: "🇦🇺" },
] as const;

export interface RegionSelectProps
  extends Omit<React.ComponentPropsWithoutRef<typeof Select>, "children"> {
  label?: React.ReactNode;
  helperText?: React.ReactNode;
  placeholder?: string;
  triggerClassName?: string;
  contentClassName?: string;
  className?: string;
}

export function RegionSelect({
  label = "Region",
  helperText = "Select the monitoring region to run checks from.",
  placeholder = "Select region",
  triggerClassName,
  contentClassName,
  className,
  ...props
}: RegionSelectProps) {
  const id = React.useId();

  return (
    <div className={cn("grid gap-1.5", className)}>
      {label ? <Label htmlFor={id}>{label}</Label> : null}
      <Select {...props}>
        <SelectTrigger id={id} className={cn("w-full", triggerClassName)}>
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent className={contentClassName}>
          {REGIONS.map((region) => (
            <SelectItem key={region.value} value={region.value}>
              <span className="flex items-center gap-2">
                <span aria-hidden="true">{region.flag}</span>
                <span>{region.label}</span>
              </span>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {helperText ? (
        <p className="text-muted-foreground text-xs">{helperText}</p>
      ) : null}
    </div>
  );
}
