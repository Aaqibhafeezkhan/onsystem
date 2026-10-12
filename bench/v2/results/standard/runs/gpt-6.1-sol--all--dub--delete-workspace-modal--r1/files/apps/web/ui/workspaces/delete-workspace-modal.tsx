"use client";

import { Button, Input, Label, Modal } from "@dub/ui";
import { useEffect, useId, useRef, useState } from "react";
import type { Dispatch, FormEvent, SetStateAction } from "react";

export interface DeleteWorkspaceModalProps {
  showModal: boolean;
  setShowModal: Dispatch<SetStateAction<boolean>>;
  workspaceSlug: string;
  onDelete: () => void | Promise<void>;
}

export function DeleteWorkspaceModal({
  showModal,
  setShowModal,
  workspaceSlug,
  onDelete,
}: DeleteWorkspaceModalProps) {
  const inputId = useId();
  const descriptionId = useId();
  const [confirmation, setConfirmation] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const deletionInProgress = useRef(false);
  const isConfirmed = workspaceSlug.length > 0 && confirmation === workspaceSlug;

  useEffect(() => {
    setConfirmation("");
    setError(null);
  }, [showModal, workspaceSlug]);

  function closeModal() {
    if (deletionInProgress.current) return;
    setConfirmation("");
    setError(null);
    setShowModal(false);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!isConfirmed || deletionInProgress.current) return;

    deletionInProgress.current = true;
    setDeleting(true);
    setError(null);

    try {
      await onDelete();
      setConfirmation("");
      setShowModal(false);
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "Unable to delete the workspace. Please try again.",
      );
    } finally {
      deletionInProgress.current = false;
      setDeleting(false);
    }
  }

  return (
    <Modal
      showModal={showModal}
      setShowModal={setShowModal}
      onClose={closeModal}
      preventDefaultClose={deleting}
      drawerRootProps={{ dismissible: !deleting }}
    >
      <form
        onSubmit={handleSubmit}
        className="flex flex-col gap-6 p-6"
        aria-busy={deleting}
      >
        <div className="flex flex-col gap-2">
          <h2 className="text-lg font-semibold text-content-emphasis">
            Delete workspace
          </h2>
          <p id={descriptionId} className="text-sm text-content-default">
            This will permanently delete your workspace, custom domains, and all
            associated links and analytics. This action cannot be undone.
          </p>
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor={inputId}>
            Type <span className="font-semibold">{workspaceSlug}</span> to confirm
            deletion.
          </Label>
          <Input
            id={inputId}
            name="workspace-slug"
            type="text"
            value={confirmation}
            onChange={(event) => setConfirmation(event.target.value)}
            aria-describedby={descriptionId}
            autoComplete="off"
            autoCapitalize="none"
            spellCheck={false}
            required
            disabled={deleting}
          />
        </div>

        {error && (
          <p role="alert" className="text-sm text-content-emphasis">
            {error}
          </p>
        )}

        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button
            type="button"
            variant="secondary"
            text="Cancel"
            onClick={closeModal}
            disabled={deleting}
          />
          <Button
            type="submit"
            variant="danger"
            text="Delete workspace"
            disabled={!isConfirmed || deleting}
            loading={deleting}
          />
        </div>
      </form>
    </Modal>
  );
}
