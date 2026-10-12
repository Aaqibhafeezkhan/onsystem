import { useId } from "react"

import { FormDescription } from "@openstatus/ui/components/ui/form"
import { Label } from "@openstatus/ui/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@openstatus/ui/components/ui/select"

type RegionSelectProps = {
  value?: string
  defaultValue?: string
  onValueChange?: (value: string) => void
}

const regions = ["Amsterdam", "Frankfurt", "Virginia", "Singapore", "Sydney"]

export function RegionSelect({
  value,
  defaultValue = "Amsterdam",
  onValueChange,
}: RegionSelectProps) {
  const id = useId()
  const descriptionId = `${id}-description`

  return (
    <div className="space-y-2">
      <Label htmlFor={id}>Monitoring region</Label>
      <Select
        value={value}
        defaultValue={defaultValue}
        onValueChange={onValueChange}
      >
        <SelectTrigger
          id={id}
          className="w-full"
          aria-describedby={descriptionId}
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
        Choose where this monitor will run its checks.
      </FormDescription>
    </div>
  )
}
