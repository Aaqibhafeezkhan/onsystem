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
import { useId } from "react";

const REGIONS = [
  { code: "ams", label: "Amsterdam", flag: "🇳🇱" },
  { code: "fra", label: "Frankfurt", flag: "🇩🇪" },
  { code: "iad", label: "Virginia", flag: "🇺🇸" },
  { code: "sin", label: "Singapore", flag: "🇸🇬" },
  { code: "syd", label: "Sydney", flag: "🇦🇺" },
] as const;

export type RegionSelectProps = {
  label?: React.ReactNode;
  helperText?: React.ReactNode;
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  id?: string;
} & Omit<
  React.ComponentProps<typeof Select>,
  "value" | "defaultValue" | "onValueChange"
>;

export function RegionSelect({
  label = "Region",
  helperText = "Select the monitoring region for your checks.",
  value,
  defaultValue,
  onValueChange,
  placeholder = "Select region",
  disabled,
  className,
  ...props
}: RegionSelectProps) {
  const generatedId = useId();
  const id = props.id ?? generatedId;

  return (
    <div className={cn("grid gap-2", className)}>
      <Label htmlFor={id}>{label}</Label>
      <Select
        value={value}
        defaultValue={defaultValue}
        onValueChange={onValueChange}
        disabled={disabled}
        {...props}
      >
        <SelectTrigger id={id} className="w-full">
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          {REGIONS.map((region) => (
            <SelectItem key={region.code} value={region.code}>
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
