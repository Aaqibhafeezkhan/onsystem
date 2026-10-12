import { Button, Modal, useMediaQuery } from "@dub/ui";
import { cn } from "@dub/utils";
import { Dispatch, FormEvent, SetStateAction, useState } from "react";

interface DeleteWorkspaceModalProps {
  showModal: boolean;
  setShowModal: Dispatch<SetStateAction<boolean>>;
  workspaceSlug: string;
  workspaceName?: string;
  onConfirm: () => Promise<void> | void;
}

export function DeleteWorkspaceModal({
  showModal,
  setShowModal,
  workspaceSlug,
  workspaceName,
  onConfirm,
}: DeleteWorkspaceModalProps) {
  const { isMobile } = useMediaQuery();
  const [deleting, setDeleting] = useState(false);
  const [slugInput, setSlugInput] = useState("");

  const isConfirmed = slugInput === workspaceSlug;

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!isConfirmed || deleting) return;

    setDeleting(true);
    try {
      await onConfirm();
      setShowModal(false);
    } finally {
      setDeleting(false);
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
          Warning: This will permanently delete your workspace
          {workspaceName ? ` "${workspaceName}"` : ""}, custom domains, and all
          associated links and their respective analytics.{" "}
          <strong className="font-semibold text-neutral-700">
            This action can't be undone
          </strong>{" "}
          – proceed with caution.
        </p>
      </div>

      <form
        onSubmit={handleSubmit}
        className="flex flex-col space-y-4 bg-neutral-50 px-4 py-4 sm:px-6"
      >
        <div>
          <label
            htmlFor="delete-workspace-slug"
            className="block text-sm text-neutral-700"
          >
            To confirm, type <span className="font-semibold">{workspaceSlug}</span>{" "}
            below
          </label>
          <div className="relative mt-1 rounded-md shadow-sm">
            <input
              type="text"
              name="delete-workspace-slug"
              id="delete-workspace-slug"
              autoFocus={!isMobile}
              autoComplete="off"
              required
              disabled={deleting}
              value={slugInput}
              onChange={(e) => setSlugInput(e.target.value)}
              placeholder={workspaceSlug}
              className={cn(
                "block w-full rounded-md border-neutral-300 text-neutral-900 placeholder-neutral-300 focus:border-neutral-500 focus:outline-none focus:ring-neutral-500 sm:text-sm",
                { "cursor-not-allowed bg-neutral-100": deleting },
              )}
            />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="secondary"
            text="Cancel"
            className="h-9 flex-1"
            onClick={() => setShowModal(false)}
            disabled={deleting}
          />
          <Button
            type="submit"
            variant="danger"
            text="Delete workspace"
            className="h-9 flex-1"
            loading={deleting}
            disabled={!isConfirmed}
          />
        </div>
      </form>
    </Modal>
  );
}
