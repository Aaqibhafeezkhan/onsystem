import { Button, Input, Label, Modal } from "@dub/ui";
import { FormEvent, useState } from "react";

interface DeleteWorkspaceModalProps {
  workspaceSlug: string;
  showModal: boolean;
  setShowModal: (show: boolean) => void;
  onDelete: () => Promise<unknown>;
}

export function DeleteWorkspaceModal({
  workspaceSlug,
  showModal,
  setShowModal,
  onDelete,
}: DeleteWorkspaceModalProps) {
  const [confirmation, setConfirmation] = useState("");
  const [deleting, setDeleting] = useState(false);

  const isConfirmed = confirmation === workspaceSlug;

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!isConfirmed || deleting) return;

    setDeleting(true);
    try {
      await onDelete();
      setShowModal(false);
    } finally {
      setDeleting(false);
    }
  }

  return (
    <Modal
      showModal={showModal}
      setShowModal={setShowModal}
      className="max-w-md"
    >
      <div className="space-y-2 border-b border-border-subtle px-4 py-4 sm:px-6">
        <h3 className="text-lg font-semibold text-content-emphasis">
          Delete workspace
        </h3>
        <p className="text-sm text-content-subtle">
          This will permanently delete the workspace, its custom domains, and
          all associated links and their analytics. This action cannot be
          undone.
        </p>
      </div>

      <form
        onSubmit={handleSubmit}
        className="flex flex-col gap-4 bg-bg-subtle px-4 py-4 sm:px-6"
      >
        <div className="flex flex-col gap-2">
          <Label htmlFor="delete-workspace-slug">
            Type <span className="font-semibold">{workspaceSlug}</span> to
            confirm
          </Label>
          <Input
            id="delete-workspace-slug"
            name="delete-workspace-slug"
            type="text"
            autoComplete="off"
            autoFocus
            value={confirmation}
            onChange={(e) => setConfirmation(e.target.value)}
            disabled={deleting}
            placeholder={workspaceSlug}
          />
        </div>

        <div className="flex items-center justify-end gap-2">
          <Button
            type="button"
            variant="secondary"
            text="Cancel"
            className="w-auto"
            onClick={() => setShowModal(false)}
            disabled={deleting}
          />
          <Button
            type="submit"
            variant="danger"
            text="Delete workspace"
            className="w-auto"
            loading={deleting}
            disabled={!isConfirmed}
          />
        </div>
      </form>
    </Modal>
  );
}
