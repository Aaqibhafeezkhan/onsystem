import { FormDescription } from "@openstatus/ui/components/ui/form";
import { Label } from "@openstatus/ui/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@openstatus/ui/components/ui/select";

type RegionSelectProps = {
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  disabled?: boolean;
};

const regions = [
  { value: "ams", label: "Amsterdam" },
  { value: "fra", label: "Frankfurt" },
  { value: "iad", label: "Virginia" },
  { value: "sin", label: "Singapore" },
  { value: "syd", label: "Sydney" },
];

export function RegionSelect({
  value,
  defaultValue,
  onValueChange,
  disabled,
}: RegionSelectProps) {
  return (
    <div className="space-y-2">
      <Label htmlFor="monitoring-region">Monitoring region</Label>
      <Select
        value={value}
        defaultValue={defaultValue}
        onValueChange={onValueChange}
        disabled={disabled}
      >
        <SelectTrigger
          id="monitoring-region"
          aria-describedby="monitoring-region-description"
          className="w-full"
        >
          <SelectValue placeholder="Select a region" />
        </SelectTrigger>
        <SelectContent>
          {regions.map((region) => (
            <SelectItem key={region.value} value={region.value}>
              {region.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <FormDescription id="monitoring-region-description">
        Choose the location where your monitor will run its checks.
      </FormDescription>
    </div>
  );
}
