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

export const REGIONS = [
  { value: "ams", label: "Amsterdam", flag: "🇳🇱" },
  { value: "fra", label: "Frankfurt", flag: "🇩🇪" },
  { value: "iad", label: "Virginia", flag: "🇺🇸" },
  { value: "sin", label: "Singapore", flag: "🇸🇬" },
  { value: "syd", label: "Sydney", flag: "🇦🇺" },
] as const;

export type RegionSelectProps = {
  label?: React.ReactNode;
  helperText?: React.ReactNode;
  placeholder?: string;
} & React.ComponentProps<typeof Select>;

export function RegionSelect({
  label = "Region",
  helperText = "Select the region from which to monitor your endpoint.",
  placeholder = "Select region",
  className,
  ...props
}: RegionSelectProps) {
  const id = useId();

  return (
    <div className={cn("grid gap-1.5", className)}>
      <Label htmlFor={id}>{label}</Label>
      <Select {...props}>
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
      {helperText ? (
        <p className="text-muted-foreground text-xs">{helperText}</p>
      ) : null}
    </div>
  );
}
