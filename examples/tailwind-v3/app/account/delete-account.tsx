// What a coding agent wrote before it could see the design system.
// `npm run check` (or the check_ui tool) reports every problem below.
import { Trash2 } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export function DeleteAccount({ onDelete }: { onDelete: () => void }) {
  return (
    <Card className="border-red-500">
      <CardHeader>
        <CardTitle>Delete account</CardTitle>
        <Card.Description>This cannot be undone.</Card.Description>
      </CardHeader>
      <CardContent className="flex items-center gap-3">
        <Badge variant="warning">Irreversible</Badge>
        <Button tone="danger" onClick={onDelete}>
          Delete account
        </Button>
        <Button variant="ghost" size="icon">
          <Trash2 />
        </Button>
        <button className="rounded-[7px] bg-zinc-100 px-3 text-sm">
          Cancel
        </button>
        <p className="text-[#71717a]">Owners only.</p>
      </CardContent>
    </Card>
  )
}
