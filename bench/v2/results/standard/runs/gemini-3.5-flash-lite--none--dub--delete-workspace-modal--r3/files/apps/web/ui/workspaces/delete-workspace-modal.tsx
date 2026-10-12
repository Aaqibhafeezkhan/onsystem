"use client";

import useWorkspace from "@/lib/swr/use-workspace";
import { BlurImage, Button, Logo, Modal, useMediaQuery } from "@dub/ui";
import { cn } from "@dub/utils";
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
  onSuccess?: () => void;
}

export function DeleteWorkspaceModal({
  showModal,
  setShowModal,
  showDeleteWorkspaceModal,
  setShowDeleteWorkspaceModal,
  workspaceSlug: workspaceSlugProp,
  onSuccess,
}: DeleteWorkspaceModalProps) {
  const { update } = useSession();
  const router = useRouter();
  const params = useParams() as { slug?: string };
  const workspace = useWorkspace();

  const slug = workspaceSlugProp || workspace.slug || params?.slug;
  const id = workspace.id;
  const name = workspace.name;
  const logo = workspace.logo;
  const isOwner = workspace.isOwner ?? true;

  const [deleting, setDeleting] = useState(false);
  const [workspaceSlugVerification, setWorkspaceSlugVerification] =
    useState("");

  const isSlugVerified = workspaceSlugVerification === slug;
  const { isMobile } = useMediaQuery();

  const isOpen =
    showModal ?? showDeleteWorkspaceModal ?? false;
  const setOpen =
    setShowModal ?? setShowDeleteWorkspaceModal ?? (() => {});

  async function deleteWorkspace() {
    return new Promise((resolve, reject) => {
      if (!id) {
        reject("Workspace ID not found");
        return;
      }
      setDeleting(true);
      fetch(`/api/workspaces/${id}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
      }).then(async (res) => {
        if (res.ok) {
          await Promise.all([mutate("/api/workspaces"), update()]);
          setOpen(false);
          onSuccess?.();
          router.push("/workspaces");
          resolve(null);
        } else {
          setDeleting(false);
          const json = await res.json().catch(() => ({}));
          reject(json?.error?.message ?? "Failed to delete workspace");
        }
      });
    });
  }

  return (
    <Modal showModal={isOpen} setShowModal={setOpen} className="max-w-md">
      <div className="space-y-2 border-b border-neutral-200 px-4 py-4 sm:px-6">
        <h3 className="text-lg font-medium">Delete Workspace</h3>
        <p className="text-sm text-neutral-500">
          Warning: This will permanently delete your workspace, custom domains,
          and all associated links and their respective analytics.
        </p>
      </div>

      <form
        onSubmit={async (e) => {
          e.preventDefault();
          toast.promise(deleteWorkspace(), {
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
          <label
            htmlFor="workspace-slug"
            className="block text-sm text-neutral-700"
          >
            Enter the workspace slug <span className="font-semibold">{slug}</span> to continue:
          </label>
          <div className="relative mt-1 rounded-md shadow-sm">
            <input
              type="text"
              name="workspace-slug"
              id="workspace-slug"
              autoFocus={!isMobile}
              autoComplete="off"
              pattern={slug}
              required
              disabled={!isOwner}
              value={workspaceSlugVerification}
              onChange={(e) => setWorkspaceSlugVerification(e.target.value)}
              className={cn(
                "block w-full rounded-md border-neutral-300 text-neutral-900 placeholder-neutral-300 focus:border-neutral-500 focus:outline-none focus:ring-neutral-500 sm:text-sm",
                {
                  "cursor-not-allowed bg-neutral-100": !isOwner,
                },
              )}
            />
          </div>
        </div>

        <div className="mt-8 flex items-center justify-end gap-2 border-t border-neutral-200 bg-neutral-50 px-4 py-5 sm:px-6 -mx-4 -mb-4 sm:-mx-6 sm:-mb-6">
          <Button
            type="button"
            variant="secondary"
            text="Cancel"
            className="h-8 w-fit px-3"
            onClick={() => setOpen(false)}
            disabled={deleting}
          />
          <Button
            type="submit"
            variant="danger"
            text="Delete workspace"
            loading={deleting}
            disabled={!isSlugVerified || !isOwner}
            className="h-8 w-fit px-3"
            {...(!isOwner && {
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
