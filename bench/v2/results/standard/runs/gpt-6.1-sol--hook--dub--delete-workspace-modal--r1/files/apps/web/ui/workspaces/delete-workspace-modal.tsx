"use client";

import { Button, Input, Label, Modal, useMediaQuery } from "@dub/ui";
import {
  type Dispatch,
  type FormEvent,
  type SetStateAction,
  useEffect,
  useId,
  useRef,
  useState,
} from "react";

interface DeleteWorkspaceModalProps {
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
  const [confirmation, setConfirmation] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const submitting = useRef(false);
  const inputId = useId();
  const descriptionId = useId();
  const { isMobile } = useMediaQuery();
  const isConfirmed = Boolean(workspaceSlug) && confirmation === workspaceSlug;

  useEffect(() => {
    setConfirmation("");
    setError(null);
  }, [showModal, workspaceSlug]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!showModal || !isConfirmed || submitting.current) return;

    submitting.current = true;
    setDeleting(true);
    setError(null);

    try {
      await onDelete();
      setShowModal(false);
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Could not delete the workspace. Please try again.",
      );
    } finally {
      submitting.current = false;
      setDeleting(false);
    }
  }

  return (
    <Modal
      showModal={showModal}
      setShowModal={setShowModal}
      preventDefaultClose={deleting}
      drawerRootProps={{ dismissible: !deleting }}
      className="max-w-md px-0"
    >
      <div className="border-border-subtle space-y-2 border-b px-5 py-4 sm:px-6">
        <h2 className="text-content-emphasis text-base font-semibold">
          Delete workspace
        </h2>
        <p id={descriptionId} className="text-content-subtle text-sm">
          Permanently delete this workspace, its custom domains, and all
          associated links and analytics. This action cannot be undone.
        </p>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="space-y-4 px-5 py-5 sm:px-6">
          <div className="space-y-2">
            <Label htmlFor={inputId} className="block">
              Type <span className="font-semibold">{workspaceSlug}</span> to
              confirm
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
              autoFocus={!isMobile}
              required
              disabled={deleting}
            />
          </div>
          {error && (
            <p role="alert" className="text-sm text-red-600">
              {error}
            </p>
          )}
        </div>

        <div className="border-border-subtle bg-bg-muted flex justify-end gap-2 border-t px-5 py-4 sm:px-6">
          <Button
            type="button"
            variant="secondary"
            text="Cancel"
            className="h-9 w-fit"
            onClick={() => setShowModal(false)}
            disabled={deleting}
          />
          <Button
            type="submit"
            variant="danger"
            text="Delete workspace"
            className="h-9 w-fit"
            disabled={!isConfirmed || deleting}
            loading={deleting}
          />
        </div>
      </form>
    </Modal>
  );
}
