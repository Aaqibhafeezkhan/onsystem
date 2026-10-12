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

interface DeleteWorkspaceModalProps {
  showModal: boolean;
  setShowModal: Dispatch<SetStateAction<boolean>>;
  workspace: { slug: string };
  onDelete: () => void | Promise<void>;
}

export function DeleteWorkspaceModal({
  showModal,
  setShowModal,
  workspace,
  onDelete,
}: DeleteWorkspaceModalProps) {
  const inputId = useId();
  const descriptionId = useId();
  const [confirmation, setConfirmation] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const deletingRef = useRef(false);
  const isConfirmed = Boolean(workspace.slug) && confirmation === workspace.slug;

  useEffect(() => {
    setConfirmation("");
    setError(null);
  }, [showModal, workspace.slug]);

  const handleOpenChange: Dispatch<SetStateAction<boolean>> = (value) => {
    if (!deletingRef.current) {
      setShowModal(value);
    }
  };

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!isConfirmed || deletingRef.current) return;

    deletingRef.current = true;
    setIsDeleting(true);
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
      deletingRef.current = false;
      setIsDeleting(false);
    }
  }

  return (
    <Modal
      showModal={showModal}
      setShowModal={handleOpenChange}
      preventDefaultClose={isDeleting}
      className="border-border-subtle bg-bg-default"
    >
      <form onSubmit={handleSubmit} aria-busy={isDeleting}>
        <div className="space-y-2 border-b border-border-subtle px-4 py-4 sm:px-6">
          <h2 className="text-lg font-semibold text-content-emphasis">
            Delete workspace
          </h2>
          <p id={descriptionId} className="text-sm text-content-subtle">
            This will permanently delete your workspace, custom domains, and all
            associated links and analytics. This action cannot be undone.
          </p>
        </div>

        <div className="space-y-3 px-4 py-6 sm:px-6">
          <Label htmlFor={inputId} className="block leading-normal">
            Type <span className="font-semibold">{workspace.slug}</span> to
            confirm deletion.
          </Label>
          <Input
            id={inputId}
            name="workspace-slug"
            type="text"
            value={confirmation}
            onChange={(event) => setConfirmation(event.target.value)}
            required
            disabled={isDeleting}
            autoComplete="off"
            autoCapitalize="none"
            spellCheck={false}
            aria-describedby={descriptionId}
            className="border-border-default bg-bg-default text-content-emphasis placeholder:text-content-muted focus:border-border-emphasis focus:ring-border-emphasis"
          />
          {error && (
            <p role="alert" className="text-sm text-content-error">
              {error}
            </p>
          )}
        </div>

        <div className="flex justify-end gap-2 border-t border-border-subtle bg-bg-muted px-4 py-4 sm:px-6">
          <Button
            type="button"
            variant="secondary"
            text="Cancel"
            className="w-fit"
            disabled={isDeleting}
            onClick={() => handleOpenChange(false)}
          />
          <Button
            type="submit"
            variant="danger"
            text="Delete workspace"
            className="w-fit"
            disabled={!isConfirmed}
            loading={isDeleting}
          />
        </div>
      </form>
    </Modal>
  );
}
