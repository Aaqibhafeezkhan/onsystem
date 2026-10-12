"use client";

import useWorkspace from "@/lib/swr/use-workspace";
import { Button, Modal, useMediaQuery } from "@dub/ui";
import { cn } from "@dub/utils";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Dispatch, SetStateAction, useState } from "react";
import { toast } from "sonner";
import { mutate } from "swr";

export function DeleteWorkspaceModal({
  showModal,
  setShowModal,
}: {
  showModal: boolean;
  setShowModal: Dispatch<SetStateAction<boolean>>;
}) {
  const { update } = useSession();
  const router = useRouter();
  const { id, slug, isOwner } = useWorkspace();
  const { isMobile } = useMediaQuery();

  const [deleting, setDeleting] = useState(false);
  const [confirmSlug, setConfirmSlug] = useState("");

  const isVerified = !!slug && confirmSlug === slug;

  async function deleteWorkspace() {
    setDeleting(true);
    const res = await fetch(`/api/workspaces/${id}`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
    });

    if (!res.ok) {
      setDeleting(false);
      const { error } = await res.json();
      throw error?.message ?? "Failed to delete workspace";
    }

    await Promise.all([mutate("/api/workspaces"), update()]);
    router.push("/workspaces");
    setShowModal(false);
  }

  return (
    <Modal
      showModal={showModal}
      setShowModal={setShowModal}
      className="max-w-md"
    >
      <div className="space-y-2 border-b border-neutral-200 px-4 py-4 sm:px-6">
        <h3 className="text-lg font-medium">Delete workspace</h3>
        <p className="text-sm text-neutral-500">
          This will permanently delete your workspace, custom domains, and all
          associated links and their analytics. This action cannot be undone.
        </p>
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (!isVerified) return;
          toast.promise(deleteWorkspace(), {
            loading: "Deleting workspace...",
            success: "Workspace deleted successfully!",
            error: (err) => err,
          });
        }}
      >
        <div className="bg-neutral-50 px-4 py-4 sm:px-6">
          <label
            htmlFor="workspace-slug"
            className="block text-sm text-neutral-700"
          >
            To confirm, type <span className="font-semibold">{slug}</span>{" "}
            below
          </label>
          <input
            type="text"
            id="workspace-slug"
            name="workspace-slug"
            autoFocus={!isMobile}
            autoComplete="off"
            required
            placeholder={slug}
            disabled={!isOwner}
            value={confirmSlug}
            onChange={(e) => setConfirmSlug(e.target.value)}
            className={cn(
              "mt-1.5 block w-full rounded-md border-neutral-300 text-neutral-900 placeholder-neutral-400 focus:border-neutral-500 focus:outline-none focus:ring-neutral-500 sm:text-sm",
              !isOwner && "cursor-not-allowed bg-neutral-100",
            )}
          />
        </div>

        <div className="flex items-center justify-end gap-2 border-t border-neutral-200 bg-neutral-50 px-4 py-4 sm:px-6">
          <Button
            type="button"
            variant="secondary"
            text="Cancel"
            className="h-8 w-fit px-3"
            onClick={() => setShowModal(false)}
            disabled={deleting}
          />
          <Button
            type="submit"
            variant="danger"
            text="Delete workspace"
            className="h-8 w-fit px-3"
            loading={deleting}
            disabled={!isVerified || !isOwner}
            {...(!isOwner && {
              disabledTooltip: "Only workspace owners can delete a workspace.",
            })}
          />
        </div>
      </form>
    </Modal>
  );
}
