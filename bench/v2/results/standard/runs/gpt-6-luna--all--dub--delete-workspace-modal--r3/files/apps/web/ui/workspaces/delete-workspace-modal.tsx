"use client";

import { Button, Input, Label, Modal } from "@dub/ui";
import type { Dispatch, FormEvent, SetStateAction } from "react";
import { useEffect, useState } from "react";

export function DeleteWorkspaceModal({
  showModal,
  setShowModal,
  workspaceSlug,
  onDelete,
  isDeleting = false,
}: {
  showModal: boolean;
  setShowModal: Dispatch<SetStateAction<boolean>>;
  workspaceSlug: string;
  onDelete: () => void | Promise<void>;
  isDeleting?: boolean;
}) {
  const [slugConfirmation, setSlugConfirmation] = useState("");
  const slugMatches = slugConfirmation === workspaceSlug;

  useEffect(() => {
    if (showModal) {
      setSlugConfirmation("");
    }
  }, [showModal]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!slugMatches || isDeleting) {
      return;
    }

    await onDelete();
    setShowModal(false);
  };

  return (
    <Modal
      showModal={showModal}
      setShowModal={setShowModal}
      className="max-w-md px-0"
    >
      <div className="flex flex-col gap-1 border-b border-border-subtle px-5 py-4 sm:px-6">
        <h2 className="text-base font-semibold text-content-emphasis">
          Delete workspace
        </h2>
        <p className="text-sm text-content-subtle">
          This will permanently delete the workspace and its data. This action
          cannot be undone.
        </p>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="space-y-3 px-5 py-4 sm:px-6">
          <div className="space-y-2">
            <Label
              htmlFor="delete-workspace-slug"
              className="text-sm text-content-emphasis"
            >
              Type <span className="font-semibold">{workspaceSlug}</span> to
              confirm deletion.
            </Label>
            <Input
              id="delete-workspace-slug"
              name="workspaceSlug"
              value={slugConfirmation}
              onChange={(event) => setSlugConfirmation(event.target.value)}
              autoComplete="off"
              autoCapitalize="none"
              spellCheck={false}
              required
            />
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 border-t border-border-subtle bg-bg-muted px-4 py-5 sm:px-6">
          <Button
            type="button"
            variant="secondary"
            className="h-8 w-fit px-3"
            text="Cancel"
            onClick={() => setShowModal(false)}
            disabled={isDeleting}
          />
          <Button
            type="submit"
            variant="danger"
            className="h-8 w-fit px-3"
            text="Delete workspace"
            loading={isDeleting}
            disabled={!slugMatches || isDeleting}
          />
        </div>
      </form>
    </Modal>
  );
}
