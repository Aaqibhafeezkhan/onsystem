"use client";

import { Button, Input, Label, Modal } from "@dub/ui";
import { Dispatch, FormEvent, SetStateAction, useState } from "react";

export function DeleteWorkspaceModal({
  showModal,
  setShowModal,
  slug,
  onDelete,
}: {
  showModal: boolean;
  setShowModal: Dispatch<SetStateAction<boolean>>;
  slug: string;
  onDelete: () => void | Promise<void>;
}) {
  const [value, setValue] = useState("");
  const [deleting, setDeleting] = useState(false);

  const close = () => {
    setValue("");
    setShowModal(false);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (value !== slug) return;
    setDeleting(true);
    try {
      await onDelete();
      close();
    } finally {
      setDeleting(false);
    }
  };

  return (
    <Modal showModal={showModal} setShowModal={setShowModal} onClose={close}>
      <div className="border-border-subtle border-b px-4 py-4 sm:px-16">
        <h3 className="text-content-emphasis text-lg font-medium">
          Delete workspace
        </h3>
        <p className="text-content-subtle mt-2 text-sm">
          This will permanently delete the workspace, its links and all
          associated data. This action cannot be undone.
        </p>
      </div>

      <form
        onSubmit={handleSubmit}
        className="bg-bg-muted flex flex-col gap-4 px-4 py-8 text-left sm:px-16"
      >
        <div>
          <Label htmlFor="confirm-workspace-slug">
            To confirm, type <strong>{slug}</strong> below
          </Label>
          <Input
            id="confirm-workspace-slug"
            className="mt-2"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder={slug}
            autoComplete="off"
            required
          />
        </div>

        <div className="flex items-center justify-end gap-2">
          <Button
            type="button"
            variant="secondary"
            text="Cancel"
            className="w-fit"
            onClick={close}
          />
          <Button
            type="submit"
            variant="danger"
            text="Delete workspace"
            className="w-fit"
            loading={deleting}
            disabled={value !== slug}
          />
        </div>
      </form>
    </Modal>
  );
}
