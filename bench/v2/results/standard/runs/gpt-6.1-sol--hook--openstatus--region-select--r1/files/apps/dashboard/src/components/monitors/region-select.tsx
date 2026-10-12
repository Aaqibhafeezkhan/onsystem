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
import { type ComponentProps, useId } from "react";

const REGIONS = [
  { value: "ams", label: "Amsterdam" },
  { value: "fra", label: "Frankfurt" },
  { value: "iad", label: "Virginia" },
  { value: "sin", label: "Singapore" },
  { value: "syd", label: "Sydney" },
];

export function RegionSelect({
  id,
  className,
  name = "region",
  ...props
}: ComponentProps<typeof Select> & {
  id?: string;
  className?: string;
}) {
  const generatedId = useId();
  const triggerId = id ?? generatedId;
  const descriptionId = `${triggerId}-description`;

  return (
    <div className={cn("grid gap-2", className)}>
      <Label htmlFor={triggerId}>Monitoring region</Label>
      <Select name={name} {...props}>
        <SelectTrigger
          id={triggerId}
          aria-describedby={descriptionId}
          className="w-full"
        >
          <SelectValue placeholder="Select a region" />
        </SelectTrigger>
        <SelectContent>
          {REGIONS.map((region) => (
            <SelectItem key={region.value} value={region.value}>
              {region.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <p id={descriptionId} className="text-muted-foreground text-sm">
        Choose the region from which your monitor will run checks.
      </p>
    </div>
  );
}
