import { Button, Modal } from "@dub/ui";
import { cn } from "@dub/utils";
import { Dispatch, SetStateAction, useState } from "react";

type DeleteWorkspaceModalProps = {
  showModal: boolean;
  setShowModal: Dispatch<SetStateAction<boolean>>;
  workspaceSlug: string;
  onDelete: () => Promise<void> | void;
};

/**
 * Confirmation modal for deleting a workspace. The user must type the
 * workspace slug before the destructive action is enabled.
 */
export function DeleteWorkspaceModal({
  showModal,
  setShowModal,
  workspaceSlug,
  onDelete,
}: DeleteWorkspaceModalProps) {
  const [slugInput, setSlugInput] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);

  const isConfirmed = slugInput === workspaceSlug;

  const handleDelete = async () => {
    if (!isConfirmed || isDeleting) return;

    setIsDeleting(true);
    try {
      await onDelete();
      setShowModal(false);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Modal
      showModal={showModal}
      setShowModal={setShowModal}
      className="max-w-md"
    >
      <div className="space-y-2 border-b border-border-subtle px-4 py-4 sm:px-6">
        <h3 className="text-lg font-medium text-content-emphasis">
          Delete workspace
        </h3>
        <p className="text-sm text-content-subtle">
          This will permanently delete this workspace, its custom domains, and
          all associated links and their analytics. This action cannot be
          undone.
        </p>
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleDelete();
        }}
        className="flex flex-col space-y-4 bg-bg-muted px-4 py-4 sm:px-6"
      >
        <div>
          <label
            htmlFor="delete-workspace-slug"
            className="block text-sm text-content-default"
          >
            To confirm, type <span className="font-semibold">{workspaceSlug}</span>{" "}
            below
          </label>
          <div className="relative mt-1 rounded-md shadow-sm">
            <input
              type="text"
              name="delete-workspace-slug"
              id="delete-workspace-slug"
              autoComplete="off"
              autoFocus
              disabled={isDeleting}
              value={slugInput}
              onChange={(e) => setSlugInput(e.target.value)}
              placeholder={workspaceSlug}
              className={cn(
                "block w-full rounded-md border-border-default text-content-emphasis placeholder-content-muted focus:border-border-emphasis focus:outline-none focus:ring-border-emphasis sm:text-sm",
                isDeleting && "cursor-not-allowed bg-bg-subtle",
              )}
            />
          </div>
        </div>

        <div className="flex items-center justify-end gap-2">
          <Button
            type="button"
            variant="secondary"
            className="h-8 w-fit"
            text="Cancel"
            disabled={isDeleting}
            onClick={() => setShowModal(false)}
          />
          <Button
            type="submit"
            variant="danger"
            className="h-8 w-fit"
            text="Delete workspace"
            loading={isDeleting}
            disabled={!isConfirmed}
          />
        </div>
      </form>
    </Modal>
  );
}
