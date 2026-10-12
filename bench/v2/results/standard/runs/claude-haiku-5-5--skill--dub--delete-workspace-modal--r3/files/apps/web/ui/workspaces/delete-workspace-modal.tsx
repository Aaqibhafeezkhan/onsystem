import { Button, Input, Modal } from "@dub/ui";
import { Dispatch, FormEvent, SetStateAction, useState } from "react";

interface DeleteWorkspaceModalProps {
  showModal: boolean;
  setShowModal: Dispatch<SetStateAction<boolean>>;
  workspaceSlug: string;
  onDelete: () => Promise<void> | void;
  isDeleting?: boolean;
}

export function DeleteWorkspaceModal({
  showModal,
  setShowModal,
  workspaceSlug,
  onDelete,
  isDeleting = false,
}: DeleteWorkspaceModalProps) {
  const [confirmation, setConfirmation] = useState("");
  const isConfirmed = confirmation === workspaceSlug;

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!isConfirmed || isDeleting) return;
    await onDelete();
  }

  return (
    <Modal
      showModal={showModal}
      setShowModal={setShowModal}
      onClose={() => setConfirmation("")}
      preventDefaultClose={isDeleting}
      className="max-w-md"
    >
      <div className="border-border-subtle space-y-2 border-b px-4 py-4 sm:px-6">
        <h3 className="text-content-emphasis text-lg font-medium">
          Delete workspace
        </h3>
        <p className="text-content-default text-sm">
          This will permanently delete the{" "}
          <span className="font-semibold">{workspaceSlug}</span> workspace,
          including its custom domains, links and their analytics. This action
          cannot be undone.
        </p>
      </div>

      <form
        onSubmit={handleSubmit}
        className="bg-bg-subtle flex flex-col space-y-4 px-4 py-4 sm:px-6"
      >
        <div>
          <label
            htmlFor="delete-workspace-confirmation"
            className="text-content-default block text-sm"
          >
            To confirm, type{" "}
            <span className="text-content-emphasis font-semibold">
              {workspaceSlug}
            </span>{" "}
            below
          </label>
          <Input
            type="text"
            id="delete-workspace-confirmation"
            name="delete-workspace-confirmation"
            autoComplete="off"
            autoFocus
            required
            disabled={isDeleting}
            value={confirmation}
            onChange={(e) => setConfirmation(e.target.value)}
            placeholder={workspaceSlug}
            aria-invalid={confirmation.length > 0 && !isConfirmed}
            className="mt-1 w-full"
          />
        </div>

        <div className="grid grid-cols-2 gap-2">
          <Button
            type="button"
            variant="secondary"
            text="Cancel"
            onClick={() => setShowModal(false)}
            disabled={isDeleting}
          />
          <Button
            type="submit"
            variant="danger"
            text="Delete workspace"
            loading={isDeleting}
            disabled={!isConfirmed || isDeleting}
          />
        </div>
      </form>
    </Modal>
  );
}
