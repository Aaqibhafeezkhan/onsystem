"use client";

import { Button, Input, Label, Modal } from "@dub/ui";
import { Dispatch, FormEvent, SetStateAction, useState } from "react";

export function DeleteWorkspaceModal({
  showModal,
  setShowModal,
  slug,
  onDelete,
  loading = false,
}: {
  showModal: boolean;
  setShowModal: Dispatch<SetStateAction<boolean>>;
  slug: string;
  onDelete: () => void | Promise<void>;
  loading?: boolean;
}) {
  const [confirmation, setConfirmation] = useState("");
  const isConfirmed = confirmation === slug;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!isConfirmed) return;
    await onDelete();
  };

  return (
    <Modal
      showModal={showModal}
      setShowModal={setShowModal}
      onClose={() => setConfirmation("")}
      className="max-w-md"
    >
      <div className="space-y-2 border-b border-border-subtle px-4 py-4 sm:px-6">
        <h3 className="text-content-emphasis text-lg font-medium">
          Delete workspace
        </h3>
        <p className="text-content-subtle text-sm">
          Warning: This will permanently delete your workspace, custom domains,
          and all associated links and their analytics.
        </p>
      </div>

      <form
        onSubmit={handleSubmit}
        className="bg-bg-muted flex flex-col space-y-4 px-4 py-4 sm:px-6"
      >
        <div>
          <Label htmlFor="workspace-slug-confirmation">
            Enter the workspace slug{" "}
            <span className="font-semibold">{slug}</span> to continue:
          </Label>
          <Input
            id="workspace-slug-confirmation"
            name="workspace-slug-confirmation"
            type="text"
            autoComplete="off"
            required
            value={confirmation}
            onChange={(e) => setConfirmation(e.target.value)}
            className="mt-1"
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
            loading={loading}
            disabled={!isConfirmed}
          />
        </div>
      </form>
    </Modal>
  );
}
