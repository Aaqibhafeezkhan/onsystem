import { Button, Input, Label, Modal } from "@dub/ui";
import { Dispatch, FormEvent, SetStateAction, useState } from "react";

export function DeleteWorkspaceModal({
  showModal,
  setShowModal,
  workspaceSlug,
  onDelete,
}: {
  showModal: boolean;
  setShowModal: Dispatch<SetStateAction<boolean>>;
  workspaceSlug: string;
  onDelete: () => void | Promise<void>;
}) {
  const [confirmation, setConfirmation] = useState("");
  const [deleting, setDeleting] = useState(false);

  const isConfirmed = confirmation === workspaceSlug;

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!isConfirmed || deleting) return;
    setDeleting(true);
    try {
      await onDelete();
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
      <form onSubmit={handleSubmit} className="flex flex-col">
        <div className="space-y-2 border-b border-border-subtle px-4 py-4 sm:px-6">
          <h3 className="text-lg font-semibold text-content-emphasis">
            Delete workspace
          </h3>
          <p className="text-sm text-content-default">
            This will permanently delete the{" "}
            <span className="font-semibold">{workspaceSlug}</span> workspace,
            its custom domains, and all associated links and analytics. This
            action cannot be undone.
          </p>
        </div>

        <div className="flex flex-col gap-2 px-4 py-4 sm:px-6">
          <Label htmlFor="delete-workspace-confirm">
            Type <span className="font-semibold">{workspaceSlug}</span> to
            confirm
          </Label>
          <Input
            id="delete-workspace-confirm"
            name="confirmation"
            type="text"
            autoComplete="off"
            autoFocus
            value={confirmation}
            onChange={(e) => setConfirmation(e.target.value)}
            placeholder={workspaceSlug}
          />
        </div>

        <div className="flex items-center justify-end gap-2 border-t border-border-subtle bg-bg-muted px-4 py-4 sm:px-6">
          <Button
            type="button"
            variant="secondary"
            text="Cancel"
            onClick={() => setShowModal(false)}
          />
          <Button
            type="submit"
            variant="danger"
            text="Delete workspace"
            loading={deleting}
            disabled={!isConfirmed}
          />
        </div>
      </form>
    </Modal>
  );
}
