"use client";

import useWorkspace from "@/lib/swr/use-workspace";
import { Button, Input, Label, Modal, useMediaQuery } from "@dub/ui";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { type Dispatch, type SetStateAction, useState } from "react";
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
  const { isMobile } = useMediaQuery();
  const { id, slug, isOwner } = useWorkspace();

  const [deleting, setDeleting] = useState(false);
  const [slugVerification, setSlugVerification] = useState("");

  const isVerified = !!slug && slugVerification === slug;

  const handleDelete = async () => {
    setDeleting(true);
    try {
      const res = await fetch(`/api/workspaces/${id}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
      });

      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        toast.error(json?.error?.message ?? "Could not delete workspace.");
        return;
      }

      await Promise.all([mutate("/api/workspaces"), update()]);
      toast.success("Workspace deleted successfully!");
      setShowModal(false);
      router.push("/workspaces");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <Modal
      showModal={showModal}
      setShowModal={setShowModal}
      className="max-w-md"
    >
      <div className="space-y-2 border-b border-neutral-200 px-4 py-4 sm:px-6">
        <h3 className="text-lg font-medium">Delete workspace</h3>
        <p className="text-sm text-neutral-500">
          Warning: This will permanently delete your workspace, custom domains,
          and all associated links and their respective analytics.
        </p>
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (isVerified && isOwner) void handleDelete();
        }}
      >
        <div className="bg-neutral-50 px-4 py-4 sm:px-6">
          <Label htmlFor="delete-workspace-slug">
            Enter the workspace slug{" "}
            <span className="font-semibold">{slug}</span> to continue:
          </Label>
          <Input
            type="text"
            id="delete-workspace-slug"
            name="workspace-slug"
            autoFocus={!isMobile}
            autoComplete="off"
            required
            disabled={!isOwner || deleting}
            value={slugVerification}
            onChange={(e) => setSlugVerification(e.target.value)}
            className="mt-2 max-w-none"
          />
        </div>

        <div className="flex items-center justify-end gap-2 border-t border-neutral-200 bg-neutral-50 px-4 py-5 sm:px-6">
          <Button
            type="button"
            variant="secondary"
            className="h-8 w-fit px-3"
            text="Cancel"
            onClick={() => setShowModal(false)}
            disabled={deleting}
          />
          <Button
            type="submit"
            variant="danger"
            className="h-8 w-fit px-3"
            text="Delete workspace"
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
