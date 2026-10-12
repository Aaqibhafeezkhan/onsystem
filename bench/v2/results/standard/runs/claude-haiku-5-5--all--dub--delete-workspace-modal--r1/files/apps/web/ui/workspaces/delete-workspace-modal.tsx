"use client";

import { Button, Input, Label, Modal } from "@dub/ui";
import { Dispatch, FormEvent, SetStateAction, useState } from "react";

interface DeleteWorkspaceModalProps {
  showModal: boolean;
  setShowModal: Dispatch<SetStateAction<boolean>>;
  workspaceSlug: string;
  onDelete: () => void | Promise<void>;
  deleting?: boolean;
}

export function DeleteWorkspaceModal({
  showModal,
  setShowModal,
  workspaceSlug,
  onDelete,
  deleting = false,
}: DeleteWorkspaceModalProps) {
  const [slugInput, setSlugInput] = useState("");

  const isConfirmed = slugInput === workspaceSlug;

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!isConfirmed || deleting) return;
    await onDelete();
  }

  return (
    <Modal
      showModal={showModal}
      setShowModal={setShowModal}
      className="max-w-md"
    >
      <div className="space-y-2 border-b border-border-subtle px-4 py-4 sm:px-6">
        <h2 className="text-lg font-semibold text-content-emphasis">
          Delete workspace
        </h2>
        <p className="text-sm text-content-subtle">
          This will permanently delete the{" "}
          <span className="font-semibold text-content-default">
            {workspaceSlug}
          </span>{" "}
          workspace, its custom domains, and all associated links and their
          analytics. This action cannot be undone.
        </p>
      </div>

      <form
        onSubmit={handleSubmit}
        className="flex flex-col gap-4 bg-bg-subtle px-4 py-4 sm:px-6"
      >
        <div className="flex flex-col gap-2">
          <Label htmlFor="delete-workspace-slug">
            To confirm, type{" "}
            <span className="font-semibold text-content-emphasis">
              {workspaceSlug}
            </span>{" "}
            below
          </Label>
          <Input
            id="delete-workspace-slug"
            name="delete-workspace-slug"
            type="text"
            autoComplete="off"
            autoFocus
            value={slugInput}
            onChange={(e) => setSlugInput(e.target.value)}
            placeholder={workspaceSlug}
            disabled={deleting}
          />
        </div>

        <div className="flex items-center justify-end gap-2">
          <Button
            type="button"
            variant="secondary"
            text="Cancel"
            onClick={() => setShowModal(false)}
            disabled={deleting}
            className="w-auto"
          />
          <Button
            type="submit"
            variant="danger"
            text="Delete workspace"
            loading={deleting}
            disabled={!isConfirmed}
            className="w-auto"
          />
        </div>
      </form>
    </Modal>
  );
}
