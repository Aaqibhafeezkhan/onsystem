import { Button, Input, Label, Modal, useMediaQuery } from "@dub/ui";
import { Dispatch, FormEvent, SetStateAction, useState } from "react";

interface DeleteWorkspaceModalProps {
  showModal: boolean;
  setShowModal: Dispatch<SetStateAction<boolean>>;
  workspaceName: string;
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
  const [verification, setVerification] = useState("");
  const [deleting, setDeleting] = useState(false);

  const { isMobile } = useMediaQuery();

  const isVerified = verification === workspaceSlug;

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!isVerified || deleting) return;

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
      <div className="space-y-2 border-b border-neutral-200 px-4 py-4 sm:px-6">
        <h3 className="text-lg font-medium">Delete workspace</h3>
        <p className="text-sm text-neutral-500">
          Warning: This will permanently delete the{" "}
          <span className="font-semibold">{workspaceName}</span> workspace, all
          of its short links, and all of its analytics. This action cannot be
          undone.
        </p>
      </div>

      <form
        onSubmit={handleSubmit}
        className="flex flex-col space-y-4 bg-neutral-50 px-4 py-4 sm:px-6"
      >
        <div className="space-y-1">
          <Label htmlFor="delete-workspace-slug">
            To confirm, type{" "}
            <span className="font-semibold">{workspaceSlug}</span> below
          </Label>
          <Input
            type="text"
            id="delete-workspace-slug"
            name="delete-workspace-slug"
            autoComplete="off"
            autoFocus={!isMobile}
            value={verification}
            onChange={(e) => setVerification(e.target.value)}
            placeholder={workspaceSlug}
            aria-describedby="delete-workspace-slug-hint"
          />
          <p id="delete-workspace-slug-hint" className="sr-only">
            Type the workspace slug exactly to enable the delete button.
          </p>
        </div>

        <div className="flex items-center justify-end gap-2">
          <Button
            type="button"
            variant="secondary"
            text="Cancel"
            className="w-auto"
            onClick={() => setShowModal(false)}
          />
          <Button
            type="submit"
            variant="danger"
            text="Delete workspace"
            className="w-auto"
            loading={deleting}
            disabled={!isVerified}
          />
        </div>
      </form>
    </Modal>
  );
}
