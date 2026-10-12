"use client";

import { Label } from "@openstatus/ui/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@openstatus/ui/components/ui/select";
import { useId } from "react";
import { cn } from "@/lib/utils";

const REGIONS = [
  { value: "ams", label: "Amsterdam", flag: "🇳🇱" },
  { value: "fra", label: "Frankfurt", flag: "🇩🇪" },
  { value: "iad", label: "Virginia", flag: "🇺🇸" },
  { value: "sin", label: "Singapore", flag: "🇸🇬" },
  { value: "syd", label: "Sydney", flag: "🇦🇺" },
] as const;

export type RegionSelectProps = {
  label?: string;
  helperText?: string;
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  disabled?: boolean;
  placeholder?: string;
  className?: string;
} & Omit<React.ComponentProps<typeof Select>, "value" | "defaultValue" | "onValueChange">;

export function RegionSelect({
  label = "Region",
  helperText = "Select the monitoring region.",
  value,
  defaultValue,
  onValueChange,
  disabled,
  placeholder = "Select region",
  className,
  ...props
}: RegionSelectProps) {
  const id = useId();

  return (
    <div className={cn("space-y-2", className)}>
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
            <SelectItem key={region.value} value={region.value}>
              <span className="flex items-center gap-2">
                <span aria-hidden="true">{region.flag}</span>
                <span>{region.label}</span>
              </span>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {helperText && (
        <p className="text-muted-foreground text-xs">{helperText}</p>
      )}
    </div>
  );
}
