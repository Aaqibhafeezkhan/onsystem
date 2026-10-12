import { Button, Input, Label, Modal, useMediaQuery } from "@dub/ui";
import { Dispatch, FormEvent, SetStateAction, useState } from "react";

interface DeleteWorkspaceModalProps {
  showModal: boolean;
  setShowModal: Dispatch<SetStateAction<boolean>>;
  workspaceSlug: string;
  onDelete: () => void | Promise<void>;
}

export function DeleteWorkspaceModal({
  showModal,
  setShowModal,
  workspaceSlug,
  onDelete,
}: DeleteWorkspaceModalProps) {
  const { isMobile } = useMediaQuery();
  const [slugConfirmation, setSlugConfirmation] = useState("");
  const [deleting, setDeleting] = useState(false);
  const isConfirmed = slugConfirmation === workspaceSlug;

  const handleDelete = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!isConfirmed || deleting) return;

    setDeleting(true);
    try {
      await onDelete();
      setShowModal(false);
      setSlugConfirmation("");
    } finally {
      setDeleting(false);
    }
  };

  const handleCancel = () => {
    setShowModal(false);
    setSlugConfirmation("");
  };

  return (
    <Modal
      showModal={showModal}
      setShowModal={setShowModal}
      className="max-w-md"
    >
      <form onSubmit={handleDelete}>
        <div className="space-y-2 border-b border-neutral-200 px-4 py-4 sm:px-6">
          <h3 className="text-lg font-medium">Delete workspace?</h3>
          <p className="text-sm text-neutral-500">
            This will permanently delete this workspace and all of its data. This
            action cannot be undone.
          </p>
        </div>

        <div className="flex flex-col gap-4 bg-neutral-50 px-4 py-4 sm:px-6">
          <div>
            <Label htmlFor="workspace-slug-confirmation">
              Type <span className="font-semibold">{workspaceSlug}</span> to
              confirm
            </Label>
            <Input
              id="workspace-slug-confirmation"
              name="workspace-slug-confirmation"
              type="text"
              autoFocus={!isMobile}
              autoComplete="off"
              required
              value={slugConfirmation}
              onChange={(event) => setSlugConfirmation(event.target.value)}
            />
          </div>

          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="secondary"
              text="Cancel"
              className="h-9 w-fit"
              onClick={handleCancel}
              disabled={deleting}
            />
            <Button
              type="submit"
              variant="danger"
              text="Delete workspace"
              className="h-9 w-fit"
              loading={deleting}
              disabled={!isConfirmed}
            />
          </div>
        </div>
      </form>
    </Modal>
  );
}
