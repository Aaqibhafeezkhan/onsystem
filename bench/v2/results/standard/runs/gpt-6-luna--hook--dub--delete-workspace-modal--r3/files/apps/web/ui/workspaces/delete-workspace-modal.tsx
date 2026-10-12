"use client";

import { Button, Input, Label, Modal, useMediaQuery } from "@dub/ui";
import { FormEvent, useState } from "react";

interface DeleteWorkspaceModalProps {
  slug: string;
  showModal: boolean;
  setShowModal: (showModal: boolean) => void;
  onDelete: () => Promise<void> | void;
}

export function DeleteWorkspaceModal({
  slug,
  showModal,
  setShowModal,
  onDelete,
}: DeleteWorkspaceModalProps) {
  const [verification, setVerification] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const { isMobile } = useMediaQuery();
  const isVerified = verification === slug;

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!isVerified || isDeleting) return;

    setIsDeleting(true);
    try {
      await onDelete();
      setShowModal(false);
      setVerification("");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Modal showModal={showModal} setShowModal={setShowModal} className="max-w-md">
      <div className="space-y-2 border-b border-neutral-200 px-4 py-4 sm:px-6">
        <h3 className="text-lg font-medium">Delete workspace</h3>
        <p className="text-sm text-neutral-500">
          This action is permanent and cannot be undone. Type the workspace slug
          below to confirm.
        </p>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="bg-neutral-50 px-4 py-4 sm:px-6">
          <Label htmlFor="workspace-slug" className="text-neutral-700">
            Enter <span className="font-semibold">{slug}</span> to continue:
          </Label>
          <Input
            id="workspace-slug"
            name="workspace-slug"
            type="text"
            required
            autoFocus={!isMobile}
            autoComplete="off"
            value={verification}
            onChange={(event) => setVerification(event.target.value)}
            className="mt-1"
          />
        </div>

        <div className="flex justify-end gap-2 border-t border-neutral-200 px-4 py-4 sm:px-6">
          <Button
            type="button"
            variant="secondary"
            text="Cancel"
            className="h-9 w-fit"
            onClick={() => setShowModal(false)}
            disabled={isDeleting}
          />
          <Button
            type="submit"
            text="Delete workspace"
            variant="danger"
            className="h-9 w-fit"
            loading={isDeleting}
            disabled={!isVerified}
          />
        </div>
      </form>
    </Modal>
  );
}
