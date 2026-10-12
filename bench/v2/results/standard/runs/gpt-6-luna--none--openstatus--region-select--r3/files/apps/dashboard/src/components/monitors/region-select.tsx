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

const REGIONS = [
  { value: "ams", label: "Amsterdam" },
  { value: "fra", label: "Frankfurt" },
  { value: "iad", label: "Virginia" },
  { value: "sin", label: "Singapore" },
  { value: "syd", label: "Sydney" },
] as const;

export type MonitoringRegion = (typeof REGIONS)[number]["value"];

export function RegionSelect({
  value,
  onValueChange,
}: {
  value?: MonitoringRegion;
  onValueChange: (value: MonitoringRegion) => void;
}) {
  const id = useId();

  return (
    <div className="grid gap-1.5">
      <Label htmlFor={id}>Monitoring region</Label>
      <Select
        value={value}
        onValueChange={(nextValue) =>
          onValueChange(nextValue as MonitoringRegion)
        }
      >
        <SelectTrigger id={id} className="w-full">
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
      <p className="text-muted-foreground text-sm">
        Choose the region where your monitor will run.
      </p>
    </div>
  );
}
