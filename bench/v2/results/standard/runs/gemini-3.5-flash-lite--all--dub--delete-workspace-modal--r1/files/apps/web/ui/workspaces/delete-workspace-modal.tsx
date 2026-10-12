"use client";

import useWorkspace from "@/lib/swr/use-workspace";
import { BlurImage, Button, Input, Label, Logo, Modal, useMediaQuery } from "@dub/ui";
import { useSession } from "next-auth/react";
import { useParams, useRouter } from "next/navigation";
import {
  Dispatch,
  SetStateAction,
  useCallback,
  useMemo,
  useState,
} from "react";
import { toast } from "sonner";
import { mutate } from "swr";

export interface DeleteWorkspaceModalProps {
  showModal?: boolean;
  setShowModal?: Dispatch<SetStateAction<boolean>>;
  showDeleteWorkspaceModal?: boolean;
  setShowDeleteWorkspaceModal?: Dispatch<SetStateAction<boolean>>;
  workspaceSlug?: string;
  onDelete?: () => void;
}

export function DeleteWorkspaceModal({
  showModal,
  setShowModal,
  showDeleteWorkspaceModal,
  setShowDeleteWorkspaceModal,
  workspaceSlug: workspaceSlugProp,
  onDelete,
}: DeleteWorkspaceModalProps) {
  const { update } = useSession();
  const router = useRouter();
  const params = useParams() as { slug?: string };
  const workspace = useWorkspace();
  const { id, isOwner, name, logo } = workspace;

  const slug = workspaceSlugProp || workspace.slug || params.slug || "";

  const isOpen = showModal ?? showDeleteWorkspaceModal ?? false;
  const setIsOpen = setShowModal ?? setShowDeleteWorkspaceModal ?? (() => {});

  const [deleting, setDeleting] = useState(false);
  const [workspaceSlugVerification, setWorkspaceSlugVerification] =
    useState("");

  const isSlugVerified = workspaceSlugVerification === slug;

  async function deleteWorkspaceAction() {
    return new Promise((resolve, reject) => {
      setDeleting(true);
      fetch(`/api/workspaces/${id || slug}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
      }).then(async (res) => {
        if (res.ok) {
          await Promise.all([mutate("/api/workspaces"), update()]);
          router.push("/workspaces");
          setIsOpen(false);
          onDelete?.();
          resolve(null);
        } else {
          setDeleting(false);
          const data = await res.json().catch(() => ({}));
          reject(data.error?.message || "Failed to delete workspace");
        }
      });
    });
  }

  const { isMobile } = useMediaQuery();

  return (
    <Modal
      showModal={isOpen}
      setShowModal={setIsOpen}
      className="max-w-md"
    >
      <div className="space-y-2 border-b border-neutral-200 px-4 py-4 sm:px-6">
        <h3 className="text-lg font-medium text-neutral-900">Delete workspace</h3>
        <p className="text-sm text-neutral-500">
          Permanently delete your workspace, custom domain, and all associated
          links + their stats. This action cannot be undone – please proceed
          with caution.
        </p>
      </div>

      <form
        onSubmit={async (e) => {
          e.preventDefault();
          toast.promise(deleteWorkspaceAction(), {
            loading: "Deleting workspace...",
            success: "Workspace deleted successfully!",
            error: (err) => err,
          });
        }}
        className="flex flex-col space-y-4 bg-neutral-50 px-4 py-4 sm:px-6"
      >
        <div className="relative flex items-center gap-3 rounded-md border border-neutral-300 bg-white px-4 py-2">
          {logo ? (
            <BlurImage
              src={logo}
              alt="Workspace logo"
              className="size-7 rounded-full"
              width={20}
              height={20}
            />
          ) : (
            <Logo className="size-7 text-neutral-500" />
          )}

          <div className="flex flex-1 flex-col gap-0.5">
            <h3 className="line-clamp-1 text-sm font-medium text-neutral-600">
              {name || slug}
            </h3>
            <p className="text-xs font-medium text-neutral-500">
              app.dub.co/{slug}
            </p>
          </div>
        </div>

        <div>
          <Label
            htmlFor="workspace-slug"
            className="block text-sm text-neutral-700"
          >
            Type the workspace slug <span className="font-semibold">{slug}</span> to confirm:
          </Label>
          <div className="relative mt-1 rounded-md shadow-sm">
            <Input
              type="text"
              name="workspace-slug"
              id="workspace-slug"
              autoFocus={!isMobile}
              autoComplete="off"
              pattern={slug}
              required
              disabled={isOwner === false}
              value={workspaceSlugVerification}
              onChange={(e) => setWorkspaceSlugVerification(e.target.value)}
              placeholder={slug}
            />
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 pt-2">
          <Button
            type="button"
            variant="secondary"
            text="Cancel"
            className="h-9 w-fit"
            onClick={() => setIsOpen(false)}
            disabled={deleting}
          />
          <Button
            type="submit"
            text="Delete workspace"
            variant="danger"
            loading={deleting}
            disabled={!isSlugVerified || (isOwner === false)}
            className="h-9 w-fit"
            {...((isOwner === false) && {
              disabledTooltip: "Only workspace owners can delete a workspace.",
            })}
          />
        </div>
      </form>
    </Modal>
  );
}

export function useDeleteWorkspaceModal() {
  const [showDeleteWorkspaceModal, setShowDeleteWorkspaceModal] =
    useState(false);

  const DeleteWorkspaceModalCallback = useCallback(() => {
    return (
      <DeleteWorkspaceModal
        showDeleteWorkspaceModal={showDeleteWorkspaceModal}
        setShowDeleteWorkspaceModal={setShowDeleteWorkspaceModal}
      />
    );
  }, [showDeleteWorkspaceModal]);

  return useMemo(
    () => ({
      setShowDeleteWorkspaceModal,
      DeleteWorkspaceModal: DeleteWorkspaceModalCallback,
    }),
    [DeleteWorkspaceModalCallback],
  );
}
