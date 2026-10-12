"use client";

import useWorkspace from "@/lib/swr/use-workspace";
import { Button, Input, Label, Modal } from "@dub/ui";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import {
  useEffect,
  useState,
  type Dispatch,
  type FormEvent,
  type SetStateAction,
} from "react";
import { toast } from "sonner";
import { mutate } from "swr";

export function DeleteWorkspaceModal({
  showModal,
  setShowModal,
}: {
  showModal: boolean;
  setShowModal: Dispatch<SetStateAction<boolean>>;
}) {
  const { id, isOwner, slug } = useWorkspace();
  const { update } = useSession();
  const router = useRouter();
  const [workspaceSlugConfirmation, setWorkspaceSlugConfirmation] =
    useState("");
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (!showModal) {
      setWorkspaceSlugConfirmation("");
    }
  }, [showModal]);

  const isConfirmed = workspaceSlugConfirmation === slug;

  const handleDelete = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!isConfirmed || !isOwner || deleting) {
      return;
    }

    setDeleting(true);
    try {
      const response = await fetch(`/api/workspaces/${id}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
      });

      if (!response.ok) {
        const result = await response.json().catch(() => ({}));
        throw new Error(result?.error?.message ?? "Could not delete workspace.");
      }

      await Promise.all([mutate("/api/workspaces"), update()]);
      setShowModal(false);
      router.push("/workspaces");
      toast.success("Workspace deleted successfully.");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Could not delete workspace.",
      );
    } finally {
      setDeleting(false);
    }
  };

  return (
    <Modal showModal={showModal} setShowModal={setShowModal} className="max-w-md px-0">
      <div className="flex flex-col gap-1 border-b border-border-subtle px-5 py-4 sm:px-6">
        <h2 className="text-base font-semibold text-content-emphasis">
          Delete workspace
        </h2>
        <p className="text-sm text-content-subtle">
          This will permanently delete this workspace and all of its data. This
          action cannot be undone.
        </p>
      </div>

      <form onSubmit={handleDelete} className="space-y-4 px-5 py-4 sm:px-6">
        <div>
          <Label
            htmlFor="delete-workspace-slug"
            className="text-sm font-medium text-content-emphasis"
          >
            Type <span className="font-semibold">{slug}</span> to confirm
          </Label>
          <Input
            id="delete-workspace-slug"
            name="workspace-slug"
            type="text"
            autoComplete="off"
            autoFocus
            required
            disabled={!isOwner || deleting}
            value={workspaceSlugConfirmation}
            onChange={(event) => setWorkspaceSlugConfirmation(event.target.value)}
            className="mt-2"
          />
        </div>

        {!isOwner && (
          <p className="text-sm text-content-subtle">
            Only workspace owners can delete a workspace.
          </p>
        )}

        <div className="flex justify-end gap-2 border-t border-border-subtle pt-4">
          <Button
            type="button"
            variant="secondary"
            text="Cancel"
            disabled={deleting}
            onClick={() => setShowModal(false)}
          />
          <Button
            type="submit"
            variant="danger"
            text="Delete workspace"
            loading={deleting}
            disabled={!isConfirmed || !isOwner || deleting}
          />
        </div>
      </form>
    </Modal>
  );
}
