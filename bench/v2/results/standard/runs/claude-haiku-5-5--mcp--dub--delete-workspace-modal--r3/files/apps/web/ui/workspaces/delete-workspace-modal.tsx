import { Button, Input, Label, Modal } from "@dub/ui";
import { FormEvent, useId, useState } from "react";

interface DeleteWorkspaceModalProps {
  showModal: boolean;
  setShowModal: (showModal: boolean) => void;
  slug: string;
  onDelete: () => Promise<void> | void;
  deleting?: boolean;
}

export function DeleteWorkspaceModal({
  showModal,
  setShowModal,
  slug,
  onDelete,
  deleting = false,
}: DeleteWorkspaceModalProps) {
  const inputId = useId();
  const [confirmation, setConfirmation] = useState("");

  const isConfirmed = confirmation === slug;

  function handleClose() {
    setConfirmation("");
    setShowModal(false);
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!isConfirmed || deleting) return;
    await onDelete();
  }

  return (
    <Modal
      showModal={showModal}
      setShowModal={(open) => {
        if (!open) handleClose();
        else setShowModal(open);
      }}
      className="max-w-md"
    >
      <div className="space-y-2 border-b border-border-subtle px-4 py-4 sm:px-6">
        <h2 className="text-lg font-semibold text-content-emphasis">
          Delete workspace
        </h2>
        <p className="text-sm text-content-subtle">
          This will permanently delete the{" "}
          <span className="font-semibold">{slug}</span> workspace, its custom
          domains, and all associated links and their analytics. This action
          cannot be undone.
        </p>
      </div>

      <form
        onSubmit={handleSubmit}
        className="flex flex-col gap-4 bg-bg-subtle px-4 py-4 sm:px-6"
      >
        <div className="flex flex-col gap-2">
          <Label htmlFor={inputId} className="text-sm text-content-default">
            To confirm, type <span className="font-semibold">{slug}</span>{" "}
            below
          </Label>
          <Input
            id={inputId}
            name="workspace-slug"
            type="text"
            autoComplete="off"
            autoFocus
            required
            placeholder={slug}
            value={confirmation}
            disabled={deleting}
            onChange={(e) => setConfirmation(e.target.value)}
          />
        </div>

        <div className="flex items-center justify-end gap-2">
          <Button
            type="button"
            variant="secondary"
            text="Cancel"
            onClick={handleClose}
            disabled={deleting}
            className="w-auto"
          />
          <Button
            type="submit"
            variant="danger"
            text="Delete workspace"
            loading={deleting}
            disabled={!isConfirmed}
            className="w-auto"
          />
        </div>
      </form>
    </Modal>
  );
}
