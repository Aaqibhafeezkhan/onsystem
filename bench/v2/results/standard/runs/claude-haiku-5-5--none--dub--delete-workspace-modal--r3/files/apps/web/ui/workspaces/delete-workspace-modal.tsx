import { Button, Modal, useMediaQuery } from "@dub/ui";
import { cn } from "@dub/utils";
import {
  Dispatch,
  FormEvent,
  SetStateAction,
  useEffect,
  useId,
  useState,
} from "react";
import { toast } from "sonner";

interface DeleteWorkspaceModalProps {
  showModal: boolean;
  setShowModal: Dispatch<SetStateAction<boolean>>;
  workspaceSlug: string;
  workspaceName?: string;
  onConfirm: () => Promise<void>;
}

export function DeleteWorkspaceModal({
  showModal,
  setShowModal,
  workspaceSlug,
  workspaceName,
  onConfirm,
}: DeleteWorkspaceModalProps) {
  const inputId = useId();
  const { isMobile } = useMediaQuery();

  const [deleting, setDeleting] = useState(false);
  const [slugInput, setSlugInput] = useState("");

  const isMatch = slugInput === workspaceSlug;

  // Clear the typed slug whenever the modal is closed
  useEffect(() => {
    if (!showModal) {
      setSlugInput("");
    }
  }, [showModal]);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!isMatch || deleting) return;

    setDeleting(true);
    try {
      await onConfirm();
      setShowModal(false);
    } catch (error) {
      toast.error(
        error instanceof Error && error.message
          ? error.message
          : "Failed to delete workspace.",
      );
    } finally {
      setDeleting(false);
    }
  };

  return (
    <Modal
      showModal={showModal}
      setShowModal={setShowModal}
      className="max-w-md"
      preventDefaultClose={deleting}
    >
      <div className="space-y-2 border-b border-border-subtle px-4 py-4 sm:px-6">
        <h3 className="text-lg font-medium text-content-emphasis">
          Delete workspace
        </h3>
        <p className="text-sm text-content-subtle">
          Warning: This will permanently delete your workspace, custom domains,
          and all associated links and their respective analytics.{" "}
          <strong className="font-semibold text-content-default">
            This action can't be undone
          </strong>
          .
        </p>
      </div>

      <form
        onSubmit={handleSubmit}
        className="flex flex-col space-y-4 bg-bg-subtle px-4 py-4 sm:px-6"
      >
        <div>
          <label
            htmlFor={inputId}
            className="block text-sm text-content-default"
          >
            Enter the workspace slug{" "}
            <span className="font-semibold">{workspaceSlug}</span> to continue:
          </label>
          {workspaceName && (
            <p className="mt-1 text-xs text-content-subtle">
              Workspace: {workspaceName}
            </p>
          )}
          <input
            id={inputId}
            name="workspace-slug"
            type="text"
            autoComplete="off"
            autoFocus={!isMobile}
            required
            disabled={deleting}
            value={slugInput}
            onChange={(e) => setSlugInput(e.target.value)}
            placeholder={workspaceSlug}
            aria-invalid={slugInput.length > 0 && !isMatch}
            className={cn(
              "mt-1 block w-full rounded-md border-border-subtle text-content-emphasis placeholder-content-subtle shadow-sm sm:text-sm",
              "focus:border-border-emphasis focus:outline-none focus:ring-border-emphasis",
              "disabled:cursor-not-allowed disabled:bg-bg-muted",
            )}
          />
        </div>

        <div className="grid grid-cols-2 gap-2">
          <Button
            type="button"
            variant="secondary"
            text="Cancel"
            onClick={() => setShowModal(false)}
            disabled={deleting}
          />
          <Button
            type="submit"
            variant="danger"
            text="Delete workspace"
            loading={deleting}
            disabled={!isMatch}
          />
        </div>
      </form>
    </Modal>
  );
}
