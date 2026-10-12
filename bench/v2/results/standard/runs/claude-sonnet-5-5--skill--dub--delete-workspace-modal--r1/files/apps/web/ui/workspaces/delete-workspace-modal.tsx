"use client";

import { Button, Input, Label, Modal } from "@dub/ui";
import { Dispatch, SetStateAction, useState } from "react";

export function DeleteWorkspaceModal({
  showModal,
  setShowModal,
  slug,
  onDelete,
}: {
  showModal: boolean;
  setShowModal: Dispatch<SetStateAction<boolean>>;
  slug: string;
  onDelete: () => Promise<void> | void;
}) {
  const [confirmation, setConfirmation] = useState("");
  const [deleting, setDeleting] = useState(false);

  const isVerified = confirmation === slug;

  return (
    <Modal showModal={showModal} setShowModal={setShowModal} className="max-w-md">
      <div className="space-y-2 border-b border-border-subtle px-4 py-4 sm:px-6">
        <h3 className="text-lg font-medium text-content-emphasis">
          Delete workspace
        </h3>
        <p className="text-sm text-content-subtle">
          Warning: This will permanently delete your workspace, custom domains,
          and all associated links and their respective analytics.
        </p>
      </div>

      <form
        onSubmit={async (e) => {
          e.preventDefault();
          if (!isVerified) return;
          setDeleting(true);
          try {
            await onDelete();
          } finally {
            setDeleting(false);
          }
        }}
        className="flex flex-col gap-4 bg-bg-muted px-4 py-4 sm:px-6"
      >
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="workspace-slug">
            Enter the workspace slug{" "}
            <span className="font-semibold">{slug}</span> to continue:
          </Label>
          <Input
            id="workspace-slug"
            name="workspace-slug"
            type="text"
            autoComplete="off"
            required
            value={confirmation}
            onChange={(e) => setConfirmation(e.target.value)}
          />
        </div>

        <div className="flex items-center justify-end gap-2">
          <Button
            type="button"
            variant="secondary"
            text="Cancel"
            className="h-9 w-fit"
            onClick={() => setShowModal(false)}
          />
          <Button
            type="submit"
            variant="danger"
            text="Delete workspace"
            className="h-9 w-fit"
            loading={deleting}
            disabled={!isVerified}
          />
        </div>
      </form>
    </Modal>
  );
}
