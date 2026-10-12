"use client";

import { Button, Input, Label, Modal } from "@dub/ui";
import {
  useEffect,
  useState,
  type Dispatch,
  type FormEvent,
  type SetStateAction,
} from "react";

export function DeleteWorkspaceModal({
  showModal,
  setShowModal,
  workspaceSlug,
  onDelete,
}: {
  showModal: boolean;
  setShowModal: Dispatch<SetStateAction<boolean>>;
  workspaceSlug: string;
  onDelete: () => void | Promise<void>;
}) {
  const [slugConfirmation, setSlugConfirmation] = useState("");
  const [deleting, setDeleting] = useState(false);
  const slugMatches = slugConfirmation === workspaceSlug;

  useEffect(() => {
    if (!showModal) {
      setSlugConfirmation("");
    }
  }, [showModal]);

  const handleDelete = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!slugMatches || deleting) {
      return;
    }

    setDeleting(true);
    try {
      await onDelete();
      setShowModal(false);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <Modal
      showModal={showModal}
      setShowModal={setShowModal}
      className="max-w-md px-0"
    >
      <form onSubmit={handleDelete}>
        <div className="space-y-2 border-b border-border-subtle px-5 py-4 sm:px-6">
          <h2 className="text-content-emphasis text-base font-semibold">
            Delete workspace
          </h2>
          <p className="text-content-subtle text-sm">
            This will permanently delete this workspace and its associated data.
            This action cannot be undone.
          </p>
        </div>

        <div className="space-y-3 px-5 py-4 sm:px-6">
          <Label
            htmlFor="delete-workspace-slug"
            className="text-content-emphasis block text-sm font-medium"
          >
            Type <span className="font-semibold">{workspaceSlug}</span> to
            confirm.
          </Label>
          <Input
            id="delete-workspace-slug"
            name="workspace-slug"
            type="text"
            value={slugConfirmation}
            onChange={(event) => setSlugConfirmation(event.target.value)}
            autoComplete="off"
            autoFocus
            required
            aria-label="Workspace slug confirmation"
          />
        </div>

        <div className="flex items-center justify-end gap-2 border-t border-border-subtle bg-bg-muted px-5 py-4 sm:px-6">
          <Button
            type="button"
            variant="secondary"
            className="h-8 w-fit px-3"
            text="Cancel"
            onClick={() => setShowModal(false)}
            disabled={deleting}
          />
          <Button
            type="submit"
            variant="danger"
            className="h-8 w-fit px-3"
            text="Delete workspace"
            loading={deleting}
            disabled={!slugMatches || deleting}
          />
        </div>
      </form>
    </Modal>
  );
}
