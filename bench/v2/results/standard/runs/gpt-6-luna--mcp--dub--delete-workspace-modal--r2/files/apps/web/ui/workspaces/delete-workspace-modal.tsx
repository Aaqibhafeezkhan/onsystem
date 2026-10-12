"use client";

import { Button, Input, Label, Modal } from "@dub/ui";
import { Dispatch, FormEvent, SetStateAction, useState } from "react";

export function DeleteWorkspaceModal({
  showModal,
  setShowModal,
  workspaceSlug,
  onDelete,
  deleting = false,
}: {
  showModal: boolean;
  setShowModal: Dispatch<SetStateAction<boolean>>;
  workspaceSlug: string;
  onDelete: () => void | Promise<void>;
  deleting?: boolean;
}) {
  const [confirmation, setConfirmation] = useState("");
  const isConfirmed = confirmation === workspaceSlug;

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isConfirmed && !deleting) {
      void onDelete();
    }
  }

  function handleCancel() {
    setConfirmation("");
    setShowModal(false);
  }

  return (
    <Modal
      showModal={showModal}
      setShowModal={setShowModal}
      className="max-w-md"
    >
      <form onSubmit={handleSubmit}>
        <div className="space-y-2 border-b border-neutral-200 px-4 py-4 sm:px-6">
          <h2 className="text-lg font-semibold text-neutral-900">
            Delete workspace?
          </h2>
          <p className="text-sm text-neutral-500">
            This will permanently delete this workspace and its data. This action
            cannot be undone.
          </p>
        </div>

        <div className="space-y-4 bg-neutral-50 px-4 py-4 sm:px-6">
          <div className="space-y-1.5">
            <Label htmlFor="workspace-slug-confirmation" className="text-sm">
              Type <span className="font-semibold">{workspaceSlug}</span> to
              confirm.
            </Label>
            <Input
              id="workspace-slug-confirmation"
              name="workspace-slug-confirmation"
              autoComplete="off"
              value={confirmation}
              onChange={(event) => setConfirmation(event.target.value)}
              placeholder={workspaceSlug}
              disabled={deleting}
            />
          </div>

          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="secondary"
              text="Cancel"
              onClick={handleCancel}
              disabled={deleting}
            />
            <Button
              type="submit"
              variant="danger"
              text="Delete workspace"
              loading={deleting}
              disabled={!isConfirmed || deleting}
            />
          </div>
        </div>
      </form>
    </Modal>
  );
}
