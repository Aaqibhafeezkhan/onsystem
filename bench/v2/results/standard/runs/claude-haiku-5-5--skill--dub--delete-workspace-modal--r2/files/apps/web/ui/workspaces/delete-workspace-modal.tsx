"use client";

import { Button, Input, Label, Modal, useMediaQuery } from "@dub/ui";
import { Dispatch, FormEvent, SetStateAction, useState } from "react";

export function DeleteWorkspaceModal({
  showModal,
  setShowModal,
  workspaceName,
  workspaceSlug,
  onDelete,
}: {
  showModal: boolean;
  setShowModal: Dispatch<SetStateAction<boolean>>;
  workspaceName?: string;
  workspaceSlug: string;
  onDelete: () => Promise<void> | void;
}) {
  const [deleting, setDeleting] = useState(false);
  const [slugInput, setSlugInput] = useState("");

  const { isMobile } = useMediaQuery();

  const isConfirmed = slugInput === workspaceSlug;

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
          Warning: This will permanently delete{" "}
          {workspaceName ? (
            <span className="font-medium text-content-default">
              {workspaceName}
            </span>
          ) : (
            "this workspace"
          )}
          , its custom domains, and all associated links and their respective
          analytics. This action can't be undone.
        </p>
      </div>

      <form
        onSubmit={handleSubmit}
        className="flex flex-col space-y-4 bg-bg-muted px-4 py-4 sm:px-6"
      >
        <div className="space-y-2">
          <Label htmlFor="delete-workspace-slug">
            To confirm, type{" "}
            <span className="font-semibold">{workspaceSlug}</span> below
          </Label>
          <Input
            type="text"
            id="delete-workspace-slug"
            name="delete-workspace-slug"
            autoFocus={!isMobile}
            autoComplete="off"
            required
            disabled={deleting}
            value={slugInput}
            onChange={(e) => setSlugInput(e.target.value)}
            aria-invalid={slugInput.length > 0 && !isConfirmed}
          />
        </div>

        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="secondary"
            text="Cancel"
            onClick={() => setShowModal(false)}
            disabled={deleting}
          />
          <Button
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
