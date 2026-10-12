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

const REGIONS = ["ams", "fra", "iad", "sin", "syd"] as const;

export type RegionSelectProps = {
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  label?: React.ReactNode;
  helperText?: React.ReactNode;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  triggerClassName?: string;
} & Omit<React.ComponentProps<"div">, "onChange">;

export function RegionSelect({
  value,
  defaultValue,
  onValueChange,
  label = "Region",
  helperText = "Select the monitoring region for your checks.",
  placeholder = "Select region",
  disabled,
  className,
  triggerClassName,
  ...props
}: RegionSelectProps) {
  const id = React.useId();
  const descriptionId = `${id}-description`;

  return (
    <div className={cn("grid gap-2", className)} {...props}>
      {label && <Label htmlFor={id}>{label}</Label>}
      <Select
        value={value}
        defaultValue={defaultValue}
        onValueChange={onValueChange}
        disabled={disabled}
      >
        <SelectTrigger
          id={id}
          aria-describedby={helperText ? descriptionId : undefined}
          className={cn("w-full", triggerClassName)}
        >
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          {REGIONS.map((code) => {
            const info = getRegionInfo(code);
            return (
              <SelectItem key={code} value={code}>
                <div className="flex items-center gap-2">
                  <span>{info.flag}</span>
                  <span>{info.location}</span>
                </div>
              </SelectItem>
            );
          })}
        </SelectContent>
      </Select>
      {helperText && (
        <p id={descriptionId} className="text-muted-foreground text-sm">
          {helperText}
        </p>
      )}
    </div>
  );
}
