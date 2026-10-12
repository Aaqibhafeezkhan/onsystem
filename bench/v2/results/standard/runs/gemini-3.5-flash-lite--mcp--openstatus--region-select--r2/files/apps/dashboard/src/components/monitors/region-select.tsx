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

const REGIONS = [
  { code: "ams", name: "Amsterdam" },
  { code: "fra", name: "Frankfurt" },
  { code: "iad", name: "Virginia" },
  { code: "sin", name: "Singapore" },
  { code: "syd", name: "Sydney" },
] as const;

export interface RegionSelectProps
  extends React.ComponentPropsWithoutRef<typeof Select> {
  label?: React.ReactNode;
  helperText?: React.ReactNode;
  placeholder?: string;
  className?: string;
  triggerClassName?: string;
  id?: string;
}

export function RegionSelect({
  label = "Region",
  helperText = "Select the monitoring region for your check.",
  placeholder = "Select region...",
  className,
  triggerClassName,
  id,
  ...props
}: RegionSelectProps) {
  const generatedId = React.useId();
  const selectId = id ?? generatedId;

  return (
    <div className={cn("space-y-2", className)}>
      {label ? <Label htmlFor={selectId}>{label}</Label> : null}
      <Select {...props}>
        <SelectTrigger id={selectId} className={cn("w-full", triggerClassName)}>
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          {REGIONS.map(({ code }) => {
            const info = getRegionInfo(code);
            return (
              <SelectItem key={code} value={code}>
                <span className="flex items-center gap-2">
                  <span aria-hidden="true">{info.flag}</span>
                  <span>{info.location}</span>
                </span>
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
