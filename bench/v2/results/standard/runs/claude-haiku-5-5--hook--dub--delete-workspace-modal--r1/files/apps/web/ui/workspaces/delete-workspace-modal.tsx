import { Button, Input, Label, Modal, useMediaQuery } from "@dub/ui";
import { Dispatch, FormEvent, SetStateAction, useEffect, useState } from "react";

interface DeleteWorkspaceModalProps {
  showModal: boolean;
  setShowModal: Dispatch<SetStateAction<boolean>>;
  workspaceSlug: string;
  workspaceName?: string;
  onDelete: () => Promise<void>;
  isOwner?: boolean;
}

export function DeleteWorkspaceModal({
  showModal,
  setShowModal,
  workspaceSlug,
  workspaceName,
  onDelete,
  isOwner = true,
}: DeleteWorkspaceModalProps) {
  const [deleting, setDeleting] = useState(false);
  const [slugInput, setSlugInput] = useState("");

  const { isMobile } = useMediaQuery();

  const isSlugMatch = slugInput === workspaceSlug;
  const canDelete = isSlugMatch && isOwner && !deleting;

  // Clear the typed slug whenever the modal closes.
  useEffect(() => {
    if (!showModal) setSlugInput("");
  }, [showModal]);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!canDelete) return;

    setDeleting(true);
    try {
      await onDelete();
      setShowModal(false);
    } catch {
      // The caller is responsible for surfacing errors (e.g. via toast).
    } finally {
      setDeleting(false);
    }
  };

  return (
    <Modal
      showModal={showModal}
      setShowModal={(next) => {
        if (!deleting) setShowModal(next);
      }}
      className="max-w-md"
    >
      <div className="space-y-2 border-b border-neutral-200 px-4 py-4 sm:px-6">
        <h3 className="text-lg font-medium">Delete workspace</h3>
        <p className="text-sm text-neutral-500">
          Warning: This will permanently delete the{" "}
          <span className="font-semibold text-neutral-700">
            {workspaceName || workspaceSlug}
          </span>{" "}
          workspace, its custom domains, and all associated links and their
          analytics.{" "}
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
        <div className="space-y-1">
          <Label
            htmlFor="delete-workspace-slug"
            className="font-normal text-neutral-700"
          >
            To confirm, enter the workspace slug{" "}
            <span className="font-semibold">{workspaceSlug}</span> below:
          </Label>
          <Input
            type="text"
            name="delete-workspace-slug"
            id="delete-workspace-slug"
            autoFocus={!isMobile}
            autoComplete="off"
            required
            disabled={!isOwner || deleting}
            value={slugInput}
            onChange={(e) => setSlugInput(e.target.value)}
            placeholder={workspaceSlug}
            className="max-w-none disabled:cursor-not-allowed disabled:bg-neutral-100"
          />
        </div>

        <div className="flex items-center justify-end gap-2">
          <Button
            type="button"
            variant="secondary"
            text="Cancel"
            onClick={() => setShowModal(false)}
            disabled={deleting}
            className="h-9 w-auto px-4"
          />
          <Button
            type="submit"
            variant="danger"
            text="Delete workspace"
            loading={deleting}
            disabled={!canDelete}
            {...(!isOwner && {
              disabledTooltip: "Only workspace owners can delete a workspace.",
            })}
            className="h-9 w-auto px-4"
          />
        </div>
      </form>
    </Modal>
  );
}
