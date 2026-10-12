"use client";

import { Button, Input, Modal } from "@dub/ui";
import { Dispatch, FormEvent, SetStateAction, useState } from "react";

interface DeleteWorkspaceModalProps {
  slug: string;
  showModal: boolean;
  setShowModal: Dispatch<SetStateAction<boolean>>;
  onDelete: () => void | Promise<void>;
  isDeleting?: boolean;
}

export function DeleteWorkspaceModal({
  slug,
  showModal,
  setShowModal,
  onDelete,
  isDeleting = false,
}: DeleteWorkspaceModalProps) {
  const [confirmation, setConfirmation] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isConfirmed = confirmation === slug;

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!isConfirmed || isDeleting || isSubmitting) return;

    setIsSubmitting(true);
    try {
      await onDelete();
      setShowModal(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal showModal={showModal} setShowModal={setShowModal} className="max-w-md">
      <div className="space-y-2 border-b border-neutral-200 px-4 py-4 sm:px-6">
        <h3 className="text-lg font-medium">Delete workspace</h3>
        <p className="text-sm text-neutral-500">
          This will permanently delete this workspace and its associated data.
          This action cannot be undone.
        </p>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="flex flex-col gap-4 bg-neutral-50 px-4 py-5 sm:px-6">
          <label htmlFor="delete-workspace-slug" className="text-sm text-neutral-700">
            Type <span className="font-semibold">{slug}</span> to confirm.
            <Input
              id="delete-workspace-slug"
              name="workspaceSlug"
              type="text"
              autoComplete="off"
              required
              value={confirmation}
              onChange={(event) => setConfirmation(event.target.value)}
              className="mt-2 max-w-none"
            />
          </label>
        </div>

        <div className="flex items-center justify-end gap-2 border-t border-neutral-200 px-4 py-4 sm:px-6">
          <Button
            type="button"
            variant="secondary"
            text="Cancel"
            className="h-9 w-fit"
            onClick={() => setShowModal(false)}
            disabled={isDeleting || isSubmitting}
          />
          <Button
            type="submit"
            variant="danger"
            text="Delete workspace"
            className="h-9 w-fit"
            loading={isDeleting || isSubmitting}
            disabled={!isConfirmed}
          />
        </div>
      </form>
    </Modal>
  );
}
