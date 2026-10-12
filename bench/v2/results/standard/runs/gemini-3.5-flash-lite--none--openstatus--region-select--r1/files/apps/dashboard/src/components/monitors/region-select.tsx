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
import React, { useId } from "react";

const MONITORING_REGIONS = [
  { code: "ams", name: "Amsterdam" },
  { code: "fra", name: "Frankfurt" },
  { code: "iad", name: "Virginia" },
  { code: "sin", name: "Singapore" },
  { code: "syd", name: "Sydney" },
] as const;

export type RegionSelectProps = React.ComponentProps<typeof Select> & {
  label?: React.ReactNode;
  helperText?: React.ReactNode;
  placeholder?: string;
  className?: string;
  triggerClassName?: string;
};

export function RegionSelect({
  label = "Region",
  helperText = "Select the region where your monitor will execute checks.",
  placeholder = "Select region",
  className,
  triggerClassName,
  id: idProp,
  ...props
}: RegionSelectProps) {
  const generatedId = useId();
  const id = idProp ?? generatedId;

  return (
    <div className={cn("grid w-full gap-1.5", className)}>
      <Label htmlFor={id}>{label}</Label>
      <Select {...props}>
        <SelectTrigger id={id} className={cn("w-full", triggerClassName)}>
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          {MONITORING_REGIONS.map(({ code, name }) => {
            const info = getRegionInfo(code);
            return (
              <SelectItem key={code} value={code}>
                <span className="flex items-center gap-2">
                  <span aria-hidden="true">{info.flag}</span>
                  <span>{name}</span>
                  <span className="text-muted-foreground text-xs">
                    ({info.location})
                  </span>
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
