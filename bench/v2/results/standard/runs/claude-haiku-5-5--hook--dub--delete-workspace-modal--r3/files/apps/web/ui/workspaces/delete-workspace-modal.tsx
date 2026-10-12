import { Button, Input, Label, Modal } from "@dub/ui";
import { Dispatch, SetStateAction, useEffect, useState } from "react";
import { toast } from "sonner";

interface DeleteWorkspaceModalProps {
  showModal: boolean;
  setShowModal: Dispatch<SetStateAction<boolean>>;
  /** Slug of the workspace being deleted; the user must type it to confirm. */
  workspaceSlug: string;
  /** Optional display name shown in the header description. */
  workspaceName?: string;
  /** Called when the user confirms. Modal closes on success. */
  onConfirm: () => Promise<unknown>;
}

export function DeleteWorkspaceModal({
  showModal,
  setShowModal,
  workspaceSlug,
  workspaceName,
  onConfirm,
}: DeleteWorkspaceModalProps) {
  const [slugInput, setSlugInput] = useState("");
  const [deleting, setDeleting] = useState(false);

  // Reset the confirmation input every time the modal opens or closes.
  useEffect(() => {
    if (!showModal) setSlugInput("");
  }, [showModal]);

  const isConfirmed = slugInput === workspaceSlug;

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!isConfirmed || deleting) return;

    setDeleting(true);
    try {
      await onConfirm();
      setShowModal(false);
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to delete workspace. Please try again.",
      );
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
      <div className="space-y-2 border-b border-border-subtle px-4 py-4 sm:px-6">
        <h3 className="text-lg font-medium text-content-emphasis">
          Delete workspace
        </h3>
        <p className="text-sm text-content-subtle">
          This will permanently delete{" "}
          {workspaceName ? (
            <span className="font-medium text-content-emphasis">
              {workspaceName}
            </span>
          ) : (
            "this workspace"
          )}
          , including its custom domains, links, and their analytics. This
          action can't be undone.
        </p>
      </div>

      <form
        onSubmit={handleSubmit}
        className="flex flex-col space-y-4 bg-bg-subtle px-4 py-4 sm:px-6"
      >
        <div>
          <Label
            htmlFor="delete-workspace-slug"
            className="block font-normal text-content-default"
          >
            To confirm, type{" "}
            <span className="font-semibold text-content-emphasis">
              {workspaceSlug}
            </span>{" "}
            below
          </Label>
          <Input
            type="text"
            id="delete-workspace-slug"
            name="delete-workspace-slug"
            autoComplete="off"
            autoFocus
            required
            value={slugInput}
            onChange={(e) => setSlugInput(e.target.value)}
            placeholder={workspaceSlug}
            disabled={deleting}
            className="mt-1 max-w-none"
          />
        </div>

        <div className="grid grid-cols-2 gap-2">
          <Button
            type="button"
            variant="secondary"
            text="Cancel"
            onClick={() => setShowModal(false)}
            disabled={deleting}
          />
          <Button
            type="submit"
            variant="danger"
            text="Delete workspace"
            loading={deleting}
            disabled={!isConfirmed}
          />
        </div>
      </form>
    </Modal>
  );
}
