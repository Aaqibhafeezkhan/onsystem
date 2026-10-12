import { Button, Input, Label, Modal, useMediaQuery } from "@dub/ui";
import { FormEvent, useState } from "react";

interface DeleteWorkspaceModalProps {
  showModal: boolean;
  setShowModal: (showModal: boolean) => void;
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
  const [slugInput, setSlugInput] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const isSlugConfirmed = slugInput === workspaceSlug;

  const closeModal = () => {
    if (isDeleting) return;
    setSlugInput("");
    setShowModal(false);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!isSlugConfirmed || isDeleting) return;

    setIsDeleting(true);
    try {
      await onDelete();
      setSlugInput("");
      setShowModal(false);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Modal showModal={showModal} setShowModal={closeModal} className="max-w-md">
      <div className="space-y-2 border-b border-neutral-200 px-4 py-4 sm:px-6">
        <h3 className="text-lg font-medium">Delete workspace</h3>
        <p className="text-sm text-neutral-500">
          This will permanently delete this workspace and its associated data.
          This action cannot be undone.
        </p>
      </div>

      <form
        onSubmit={handleSubmit}
        className="flex flex-col gap-6 bg-neutral-50 px-4 py-4 sm:px-6"
      >
        <div>
          <Label htmlFor="delete-workspace-slug">
            Type the workspace slug{" "}
            <span className="font-semibold">{workspaceSlug}</span> to confirm.
          </Label>
          <Input
            id="delete-workspace-slug"
            name="workspaceSlug"
            type="text"
            required
            autoComplete="off"
            autoFocus={!isMobile}
            value={slugInput}
            onChange={(event) => setSlugInput(event.target.value)}
            className="mt-1"
          />
        </div>

        <div className="flex justify-end gap-2">
          <Button
            type="button"
            variant="secondary"
            text="Cancel"
            className="h-9 w-fit"
            onClick={closeModal}
            disabled={isDeleting}
          />
          <Button
            type="submit"
            variant="danger"
            text="Delete workspace"
            className="h-9 w-fit"
            loading={isDeleting}
            disabled={!isSlugConfirmed}
          />
        </div>
      </form>
    </Modal>
  );
}
