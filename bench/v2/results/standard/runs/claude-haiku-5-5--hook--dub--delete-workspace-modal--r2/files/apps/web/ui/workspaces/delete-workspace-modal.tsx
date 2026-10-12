import { Button, Input, Label, Modal, useMediaQuery } from "@dub/ui";
import {
  Dispatch,
  FormEvent,
  SetStateAction,
  useEffect,
  useState,
} from "react";

interface DeleteWorkspaceModalProps {
  showModal: boolean;
  setShowModal: Dispatch<SetStateAction<boolean>>;
  workspaceSlug: string;
  workspaceName?: string;
  onDelete: () => Promise<void> | void;
}

export function DeleteWorkspaceModal({
  showModal,
  setShowModal,
  workspaceSlug,
  workspaceName,
  onDelete,
}: DeleteWorkspaceModalProps) {
  const { isMobile } = useMediaQuery();
  const [slugInput, setSlugInput] = useState("");
  const [deleting, setDeleting] = useState(false);

  const isConfirmed = slugInput === workspaceSlug;

  // Clear the typed slug whenever the modal is closed or reopened.
  useEffect(() => {
    if (!showModal) setSlugInput("");
  }, [showModal]);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!isConfirmed || deleting) return;

    setDeleting(true);
    try {
      await onDelete();
    } finally {
      setDeleting(false);
    }
  }

  return (
    <Modal
      showModal={showModal}
      setShowModal={setShowModal}
      className="max-w-md"
    >
      <div className="space-y-2 border-b border-border-subtle px-4 py-4 sm:px-6">
        <h3 className="text-lg font-medium text-content-emphasis">
          Delete workspace
        </h3>
        <p className="text-sm text-content-subtle">
          This will permanently delete the workspace
          {workspaceName ? (
            <>
              {" "}
              <span className="font-medium text-content-default">
                {workspaceName}
              </span>
            </>
          ) : null}
          , including its custom domains, links, and their analytics. This
          action can't be undone.
        </p>
      </div>

      <form
        onSubmit={handleSubmit}
        className="flex flex-col space-y-4 bg-bg-muted px-4 py-4 sm:px-6"
      >
        <div className="space-y-1.5">
          <Label htmlFor="delete-workspace-slug" className="font-normal">
            To confirm, type{" "}
            <span className="font-semibold text-content-emphasis">
              {workspaceSlug}
            </span>{" "}
            below
          </Label>
          <Input
            type="text"
            name="delete-workspace-slug"
            id="delete-workspace-slug"
            autoFocus={!isMobile}
            autoComplete="off"
            spellCheck={false}
            required
            disabled={deleting}
            value={slugInput}
            onChange={(e) => setSlugInput(e.target.value)}
            aria-invalid={slugInput.length > 0 && !isConfirmed}
            className="max-w-none"
          />
        </div>

        <div className="flex items-center justify-end gap-2">
          <Button
            type="button"
            variant="secondary"
            text="Cancel"
            className="h-9 w-auto px-4"
            onClick={() => setShowModal(false)}
            disabled={deleting}
          />
          <Button
            type="submit"
            variant="danger"
            text="Delete workspace"
            className="h-9 w-auto px-4"
            loading={deleting}
            disabled={!isConfirmed}
          />
        </div>
      </form>
    </Modal>
  );
}
