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

export interface RegionSelectProps {
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  label?: React.ReactNode;
  helperText?: React.ReactNode;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  id?: string;
  name?: string;
}

const REGIONS = [
  { code: "ams", label: "Amsterdam" },
  { code: "fra", label: "Frankfurt" },
  { code: "iad", label: "Virginia" },
  { code: "sin", label: "Singapore" },
  { code: "syd", label: "Sydney" },
] as const;

export function RegionSelect({
  value,
  defaultValue,
  onValueChange,
  label = "Region",
  helperText = "Select the monitoring region.",
  placeholder = "Select region",
  disabled,
  className,
  id: providedId,
  name,
}: RegionSelectProps) {
  const generatedId = useId();
  const id = providedId ?? generatedId;

  return (
    <div className={cn("grid w-full gap-1.5", className)}>
      {label && <Label htmlFor={id}>{label}</Label>}
      <Select
        value={value}
        defaultValue={defaultValue}
        onValueChange={onValueChange}
        disabled={disabled}
        name={name}
      >
        <SelectTrigger id={id} className="w-full">
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          {REGIONS.map((region) => (
            <SelectItem key={region.code} value={region.code}>
              {region.label}
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
