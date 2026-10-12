import { FormDescription } from "@openstatus/ui/components/ui/form";
import { Label } from "@openstatus/ui/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@openstatus/ui/components/ui/select";

const regions = [
  { value: "amsterdam", label: "Amsterdam" },
  { value: "frankfurt", label: "Frankfurt" },
  { value: "virginia", label: "Virginia" },
  { value: "singapore", label: "Singapore" },
  { value: "sydney", label: "Sydney" },
];

export function RegionSelect() {
  return (
    <div className="space-y-2">
      <Label htmlFor="monitoring-region">Monitoring region</Label>
      <Select defaultValue="amsterdam" name="region">
        <SelectTrigger
          id="monitoring-region"
          aria-describedby="monitoring-region-description"
        >
          <SelectValue placeholder="Choose a region" />
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
        Choose where your monitor will run from.
      </FormDescription>
    </div>
  );
}
