import { Button, Input, Label, Modal } from "@dub/ui";
import { Dispatch, FormEvent, SetStateAction, useId, useState } from "react";

interface DeleteWorkspaceModalProps {
  showModal: boolean;
  setShowModal: Dispatch<SetStateAction<boolean>>;
  workspaceName?: string;
  workspaceSlug: string;
  onDelete: () => Promise<void> | void;
}

export function DeleteWorkspaceModal({
  showModal,
  setShowModal,
  workspaceName,
  workspaceSlug,
  onDelete,
}: DeleteWorkspaceModalProps) {
  const inputId = useId();
  const [typedSlug, setTypedSlug] = useState("");
  const [deleting, setDeleting] = useState(false);

  const isConfirmed = typedSlug === workspaceSlug;

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
          <h2 className="text-lg font-semibold text-content-emphasis">
            Delete workspace
          </h2>
          <p className="text-sm text-content-subtle">
            This will permanently delete{" "}
            <span className="font-medium">
              {workspaceName || "this workspace"}
            </span>
            , including its links, domains and analytics. This action cannot be
            undone.
          </p>
        </div>

        <div className="flex flex-col gap-2 bg-bg-subtle px-4 py-4 sm:px-6">
          <Label htmlFor={inputId}>
            To confirm, type{" "}
            <span className="font-semibold text-content-emphasis">
              {workspaceSlug}
            </span>{" "}
            below
          </Label>
          <Input
            id={inputId}
            name="workspace-slug"
            type="text"
            autoComplete="off"
            autoFocus
            required
            value={typedSlug}
            onChange={(e) => setTypedSlug(e.target.value)}
            placeholder={workspaceSlug}
            disabled={deleting}
          />
        </div>

        <div className="flex items-center justify-end gap-2 border-t border-border-subtle px-4 py-4 sm:px-6">
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
