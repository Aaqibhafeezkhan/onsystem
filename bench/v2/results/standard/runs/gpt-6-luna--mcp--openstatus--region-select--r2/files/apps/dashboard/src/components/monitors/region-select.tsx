"use client";

import { useId } from "react";
import {
  FormDescription,
} from "@openstatus/ui/components/ui/form";
import { Label } from "@openstatus/ui/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@openstatus/ui/components/ui/select";

const regions = [
  "Amsterdam",
  "Frankfurt",
  "Virginia",
  "Singapore",
  "Sydney",
] as const;

type RegionSelectProps = React.ComponentProps<typeof Select>;

export function RegionSelect({ defaultValue, ...props }: RegionSelectProps) {
  const id = useId();
  const descriptionId = `${id}-description`;

  return (
    <div className="grid gap-2">
      <Label htmlFor={id}>Monitoring region</Label>
      <Select defaultValue={defaultValue ?? "Amsterdam"} {...props}>
        <SelectTrigger
          id={id}
          aria-describedby={descriptionId}
          className="w-full"
        >
          <SelectValue placeholder="Choose a region" />
        </SelectTrigger>
        <SelectContent>
          {regions.map((region) => (
            <SelectItem key={region} value={region}>
              {region}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <FormDescription id={descriptionId}>
        Checks will run from this region. Choose the location closest to your
        users.
      </FormDescription>
    </div>
  );
}
