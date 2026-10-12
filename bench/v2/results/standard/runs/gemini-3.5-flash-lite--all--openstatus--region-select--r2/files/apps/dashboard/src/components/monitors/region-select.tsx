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

const REGION_CODES = ["ams", "fra", "iad", "sin", "syd"] as const;

export interface RegionSelectProps extends React.ComponentProps<"div"> {
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  label?: React.ReactNode;
  helperText?: React.ReactNode;
  placeholder?: string;
  disabled?: boolean;
}

export function RegionSelect({
  value,
  defaultValue,
  onValueChange,
  label = "Region",
  helperText = "Select the monitoring region for your checks.",
  placeholder = "Select region",
  disabled,
  className,
  ...props
}: RegionSelectProps) {
  const id = React.useId();

  return (
    <div className={cn("space-y-2", className)} {...props}>
      {label && <Label htmlFor={id}>{label}</Label>}
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
          {REGION_CODES.map((code) => {
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
      {helperText && (
        <p className="text-muted-foreground text-sm">{helperText}</p>
      )}
    </div>
  );
}
