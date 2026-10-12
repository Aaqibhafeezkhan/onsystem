import { Button, Modal, useMediaQuery } from "@dub/ui";
import { FormEvent, useState } from "react";

interface DeleteWorkspaceModalProps {
  slug: string;
  showModal: boolean;
  setShowModal: (showModal: boolean) => void;
  onDelete: () => void | Promise<void>;
  isDeleting?: boolean;
}

export function DeleteWorkspaceModal({
  slug,
  showModal,
  setShowModal,
  onDelete,
  isDeleting = false,
}: DeleteWorkspaceModalProps) {
  const [confirmation, setConfirmation] = useState("");
  const { isMobile } = useMediaQuery();
  const isConfirmed = confirmation === slug;

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isConfirmed && !isDeleting) {
      void onDelete();
    }
  };

  return (
    <Modal
      showModal={showModal}
      setShowModal={setShowModal}
      className="max-w-md"
    >
      <div className="space-y-2 border-b border-neutral-200 px-4 py-4 sm:px-6">
        <h3 className="text-lg font-medium">Delete workspace</h3>
        <p className="text-sm text-neutral-500">
          This will permanently delete this workspace and its associated data.
          This action cannot be undone.
        </p>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="space-y-4 bg-neutral-50 px-4 py-4 sm:px-6">
          <div>
            <label
              htmlFor="delete-workspace-slug"
              className="block text-sm text-neutral-700"
            >
              Type <span className="font-semibold">{slug}</span> to confirm
              deletion.
            </label>
            <input
              id="delete-workspace-slug"
              name="workspace-slug"
              type="text"
              required
              autoFocus={!isMobile}
              autoComplete="off"
              value={confirmation}
              onChange={(event) => setConfirmation(event.target.value)}
              className="mt-1 block w-full rounded-md border-neutral-300 text-neutral-900 placeholder-neutral-300 focus:border-neutral-500 focus:outline-none focus:ring-neutral-500 sm:text-sm"
            />
          </div>
        </div>

        <div className="flex justify-end gap-2 border-t border-neutral-200 px-4 py-4 sm:px-6">
          <Button
            type="button"
            variant="secondary"
            text="Cancel"
            className="h-9 w-fit"
            onClick={() => setShowModal(false)}
            disabled={isDeleting}
          />
          <Button
            type="submit"
            text="Delete workspace"
            variant="danger"
            className="h-9 w-fit"
            loading={isDeleting}
            disabled={!isConfirmed || isDeleting}
          />
        </div>
      </form>
    </Modal>
  );
}
