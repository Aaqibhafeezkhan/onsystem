import { Button, Modal } from "@dub/ui";
import { cn } from "@dub/utils";
import { FormEvent, useEffect, useId, useState } from "react";

interface DeleteWorkspaceModalProps {
  showModal: boolean;
  setShowModal: (showModal: boolean) => void;
  /** Slug the user must type to confirm the deletion. */
  workspaceSlug: string;
  /**
   * Called once the user confirms. Should perform the deletion and handle
   * its own error reporting; the modal resets its loading state afterwards.
   */
  onDelete: () => Promise<void> | void;
}

export function DeleteWorkspaceModal({
  showModal,
  setShowModal,
  workspaceSlug,
  onDelete,
}: DeleteWorkspaceModalProps) {
  const inputId = useId();
  const [confirmation, setConfirmation] = useState("");
  const [deleting, setDeleting] = useState(false);

  const isConfirmed = confirmation === workspaceSlug;

  // Clear the typed slug whenever the modal is closed.
  useEffect(() => {
    if (!showModal) setConfirmation("");
  }, [showModal]);

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
      <div className="space-y-2 border-b border-border-subtle px-4 py-4 sm:px-6">
        <h3 className="text-lg font-medium text-content-emphasis">
          Delete workspace
        </h3>
        <p className="text-sm text-content-subtle">
          This will permanently delete your workspace, custom domains, and all
          associated links and their analytics. This action cannot be undone.
        </p>
      </div>

      <form
        onSubmit={handleSubmit}
        className="flex flex-col space-y-4 bg-bg-muted px-4 py-4 sm:px-6"
      >
        <div>
          <label
            htmlFor={inputId}
            className="block text-sm text-content-default"
          >
            To confirm, type{" "}
            <span className="font-semibold text-content-emphasis">
              {workspaceSlug}
            </span>{" "}
            below:
          </label>
          <input
            id={inputId}
            name="workspace-slug"
            type="text"
            autoComplete="off"
            autoFocus
            required
            value={confirmation}
            disabled={deleting}
            onChange={(e) => setConfirmation(e.target.value)}
            aria-invalid={confirmation.length > 0 && !isConfirmed}
            placeholder={workspaceSlug}
            className={cn(
              "mt-1 block w-full rounded-md border-border-default text-content-emphasis placeholder-content-muted focus:border-border-emphasis focus:outline-none focus:ring-border-emphasis sm:text-sm",
              deleting && "cursor-not-allowed bg-bg-subtle",
            )}
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
