"use client";

import { Button, Input, Modal, useMediaQuery } from "@dub/ui";
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
  const deletionInProgress = useRef(false);
  const inputId = useId();
  const { isMobile } = useMediaQuery();
  const isConfirmed = workspaceSlug.length > 0 && confirmation === workspaceSlug;

  useEffect(() => {
    setConfirmation("");
    setError(null);
  }, [showModal, workspaceSlug]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!isConfirmed || deletionInProgress.current) return;

    deletionInProgress.current = true;
    setDeleting(true);
    setError(null);

    try {
      await onDelete();
      setShowModal(false);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Could not delete the workspace. Please try again.",
      );
    } finally {
      deletionInProgress.current = false;
      setDeleting(false);
    }
  }

  return (
    <Modal
      showModal={showModal}
      setShowModal={(value) => {
        if (!deletionInProgress.current) setShowModal(value);
      }}
      preventDefaultClose={deleting}
      drawerRootProps={{ dismissible: !deleting }}
      className="max-w-md px-0"
    >
      <div className="border-border-subtle flex flex-col gap-2 border-b px-5 py-4 sm:px-6">
        <h2 className="text-content-emphasis text-base font-semibold">
          Delete workspace
        </h2>
        <p className="text-content-subtle text-sm">
          This will permanently delete your workspace, custom domains, and all
          associated links and analytics. This action cannot be undone.
        </p>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="space-y-3 px-5 py-5 sm:px-6">
          <label
            htmlFor={inputId}
            className="text-content-emphasis block text-sm font-medium"
          >
            Type <span className="font-semibold">{workspaceSlug}</span> to
            confirm deletion.
          </label>
          <Input
            id={inputId}
            name="workspace-slug-confirmation"
            type="text"
            value={confirmation}
            onChange={(event) => setConfirmation(event.target.value)}
            autoComplete="off"
            autoCapitalize="none"
            spellCheck={false}
            autoFocus={!isMobile}
            required
            disabled={deleting}
          />
          {error && (
            <p role="alert" className="text-sm text-red-600">
              {error}
            </p>
          )}
        </div>

        <div className="border-border-subtle bg-bg-muted flex items-center justify-end gap-2 border-t px-5 py-4 sm:px-6">
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
