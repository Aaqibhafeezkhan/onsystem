"use client";

import { Button, Input, Label, Modal } from "@dub/ui";
import {
  type Dispatch,
  type FormEvent,
  type SetStateAction,
  useEffect,
  useId,
  useRef,
  useState,
} from "react";

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
  const id = useId();
  const [confirmation, setConfirmation] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const submitting = useRef(false);
  const confirmed = workspaceSlug.length > 0 && confirmation === workspaceSlug;

  useEffect(() => {
    setConfirmation("");
    setError(null);
  }, [showModal, workspaceSlug]);

  const handleOpenChange: Dispatch<SetStateAction<boolean>> = (value) => {
    if (!submitting.current) {
      setShowModal(value);
    }
  };

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!confirmed || submitting.current) return;

    submitting.current = true;
    setDeleting(true);
    setError(null);
    try {
      await onDelete();
      setShowModal(false);
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
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
      setShowModal={handleOpenChange}
      preventDefaultClose={deleting}
      className="max-w-md bg-bg-default"
    >
      <form onSubmit={handleSubmit} aria-labelledby={`${id}-title`}>
        <div className="flex flex-col gap-2 border-b border-border-subtle px-6 py-4">
          <h2
            id={`${id}-title`}
            className="text-lg font-semibold text-content-emphasis"
          >
            Delete workspace
          </h2>
          <p id={`${id}-description`} className="text-sm text-content-subtle">
            This will permanently delete this workspace, its custom domains, and
            all associated links and analytics. This action cannot be undone.
          </p>
        </div>

        <div className="flex flex-col gap-2 px-6 py-4">
          <Label htmlFor={`${id}-slug`} className="text-content-default">
            Type <span className="font-semibold">{workspaceSlug}</span> to confirm.
          </Label>
          <Input
            id={`${id}-slug`}
            name="workspace-slug"
            type="text"
            value={confirmation}
            onChange={(event) => setConfirmation(event.target.value)}
            disabled={deleting}
            required
            autoComplete="off"
            autoCapitalize="none"
            spellCheck={false}
            aria-describedby={`${id}-description`}
          />
          {error && (
            <p role="alert" className="text-sm text-content-error">
              {error}
            </p>
          )}
        </div>

        <div className="flex items-center justify-end gap-2 border-t border-border-subtle bg-bg-muted px-6 py-4">
          <Button
            type="button"
            variant="secondary"
            text="Cancel"
            disabled={deleting}
            onClick={() => handleOpenChange(false)}
            className="w-fit"
          />
          <Button
            type="submit"
            variant="danger"
            text="Delete workspace"
            disabled={!confirmed || deleting}
            loading={deleting}
            className="w-fit"
          />
        </div>
      </form>
    </Modal>
  );
}
