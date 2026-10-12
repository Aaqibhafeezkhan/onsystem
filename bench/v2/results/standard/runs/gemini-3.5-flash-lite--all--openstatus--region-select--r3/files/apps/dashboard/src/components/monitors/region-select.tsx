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

export interface RegionSelectProps
  extends Omit<React.ComponentPropsWithoutRef<typeof Select>, "children"> {
  label?: string;
  helperText?: string;
  placeholder?: string;
  className?: string;
  id?: string;
}

export const REGIONS = [
  { value: "ams", label: "Amsterdam", flag: "🇳🇱" },
  { value: "fra", label: "Frankfurt", flag: "🇩🇪" },
  { value: "iad", label: "Virginia", flag: "🇺🇸" },
  { value: "sin", label: "Singapore", flag: "🇸🇬" },
  { value: "syd", label: "Sydney", flag: "🇦🇺" },
] as const;

export function RegionSelect({
  label = "Monitoring Region",
  helperText = "Select the geographic region where checks will be executed.",
  placeholder = "Select region",
  className,
  id = "region-select",
  value,
  defaultValue,
  onValueChange,
  disabled,
  ...props
}: RegionSelectProps) {
  const [region, setRegion] = React.useState<string | undefined>(
    value ?? defaultValue
  );

  React.useEffect(() => {
    if (value !== undefined) {
      setRegion(value);
    }
  }, [value]);

  const handleValueChange = (val: string) => {
    if (value === undefined) {
      setRegion(val);
    }
    onValueChange?.(val);
  };

  return (
    <div className={cn("space-y-2", className)} {...props}>
      <Label htmlFor={id}>{label}</Label>
      <Select
        value={value ?? region}
        defaultValue={defaultValue}
        onValueChange={handleValueChange}
        disabled={disabled}
      >
        <SelectTrigger id={id} className="w-full">
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          {REGIONS.map((r) => (
            <SelectItem key={r.value} value={r.value}>
              <span className="flex items-center gap-2">
                <span aria-hidden="true">{r.flag}</span>
                <span>{r.label}</span>
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
