// Drafts for the playground. Two come from examples/shadcn-demo as they are; these two are
// written here. scripts/generate.mjs checks each against the demo design system and fails
// the build when one stops showing what its description promises.

// Apply all on this one must end on code a design-system team would merge: everything it uses
// imported (a rename fix adds no import), and no component restyled with classes (a rename fix
// keeps the native element's classes). generate.mjs checks both.
export const deleteDialog = `import { X } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"

export function DeleteProjectDialog({
  open,
  onClose,
}: {
  open: boolean
  onClose: () => void
}) {
  return (
    <Dialog isOpen={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete project?</DialogTitle>
          <Dialog.Description>Type the project name to confirm.</Dialog.Description>
        </DialogHeader>
        <p className="text-sm text-red-600">Its deployments are deleted too.</p>
        <input placeholder="acme-web" />
        <div className="mt-[18px] flex justify-end gap-2">
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X />
          </Button>
          <Button variant="error">Delete</Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
`;

export const snippet = `<div className="flex items-center gap-[6px]">
  <Badge variant="green">Active</Badge>
  <Button variant="primary" size="small" className="bg-blue-600 px-[18px]">
    Save
  </Button>
</div>
`;
