import { Button, Modal, useMediaQuery } from "@dub/ui";
import { Dispatch, FormEvent, SetStateAction, useState } from "react";

type DeleteWorkspaceModalProps = {
  showModal: boolean;
  setShowModal: Dispatch<SetStateAction<boolean>>;
  workspaceSlug: string;
  onDelete: () => Promise<void> | void;
};

export function DeleteWorkspaceModal({
  showModal,
  setShowModal,
  workspaceSlug,
  onDelete,
}: DeleteWorkspaceModalProps) {
  const [slugConfirmation, setSlugConfirmation] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const { isMobile } = useMediaQuery();
  const isConfirmed = slugConfirmation === workspaceSlug;

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!isConfirmed || isDeleting) return;

    setIsDeleting(true);
    try {
      await onDelete();
      setShowModal(false);
      setSlugConfirmation("");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleCancel = () => {
    if (isDeleting) return;
    setShowModal(false);
    setSlugConfirmation("");
  };

  return (
    <Modal
      showModal={showModal}
      setShowModal={setShowModal}
      className="max-w-md"
    >
      <div className="space-y-2 border-b border-neutral-200 px-4 py-4 sm:px-6">
        <h2 className="text-lg font-medium">Delete workspace?</h2>
        <p className="text-sm text-neutral-500">
          This will permanently delete this workspace and its associated data.
          This action cannot be undone.
        </p>
      </div>

      <form
        onSubmit={handleSubmit}
        className="flex flex-col gap-4 bg-neutral-50 px-4 py-4 sm:px-6"
      >
        <div>
          <label
            htmlFor="delete-workspace-slug"
            className="block text-sm text-neutral-700"
          >
            Type <span className="font-semibold">{workspaceSlug}</span> to
            confirm:
          </label>
          <input
            id="delete-workspace-slug"
            name="workspaceSlug"
            type="text"
            autoFocus={!isMobile}
            autoComplete="off"
            required
            value={slugConfirmation}
            onChange={(event) => setSlugConfirmation(event.target.value)}
            className="mt-1 block w-full rounded-md border-neutral-300 text-neutral-900 placeholder-neutral-300 focus:border-neutral-500 focus:outline-none focus:ring-neutral-500 sm:text-sm"
          />
        </div>

        <div className="flex justify-end gap-2">
          <Button
            type="button"
            text="Cancel"
            variant="secondary"
            className="w-fit"
            disabled={isDeleting}
            onClick={handleCancel}
          />
          <Button
            type="submit"
            text="Delete workspace"
            variant="danger"
            className="w-fit"
            loading={isDeleting}
            disabled={!isConfirmed}
          />
        </div>
      </form>
    </Modal>
  );
}
