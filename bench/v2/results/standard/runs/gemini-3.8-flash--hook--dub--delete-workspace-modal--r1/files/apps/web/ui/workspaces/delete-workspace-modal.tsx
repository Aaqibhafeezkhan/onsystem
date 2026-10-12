"use client";

import useWorkspace from "@/lib/swr/use-workspace";
import { BlurImage, Button, Logo, Modal, useMediaQuery } from "@dub/ui";
import { cn } from "@dub/utils";
import { useSession } from "next-auth/react";
import { useParams, useRouter } from "next/navigation";
import {
  Dispatch,
  FormEvent,
  SetStateAction,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import { toast } from "sonner";
import { mutate } from "swr";

export interface DeleteWorkspaceModalProps {
  showModal?: boolean;
  setShowModal?: Dispatch<SetStateAction<boolean>> | ((show: boolean) => void);
  showDeleteWorkspaceModal?: boolean;
  setShowDeleteWorkspaceModal?:
    | Dispatch<SetStateAction<boolean>>
    | ((show: boolean) => void);
  workspace?: {
    id?: string;
    slug?: string;
    name?: string | null;
    logo?: string | null;
  };
  onClose?: () => void;
  onSuccess?: () => void;
}

export function DeleteWorkspaceModal({
  showModal,
  setShowModal,
  showDeleteWorkspaceModal,
  setShowDeleteWorkspaceModal,
  workspace: workspaceProp,
  onClose,
  onSuccess,
}: DeleteWorkspaceModalProps = {}) {
  const router = useRouter();
  const { update } = useSession();
  const { isMobile } = useMediaQuery();

  const workspaceFromContext = useWorkspace();
  const params = useParams() as { slug?: string };

  const id = workspaceProp?.id ?? workspaceFromContext?.id;
  const slug =
    workspaceProp?.slug ??
    workspaceFromContext?.slug ??
    params?.slug ??
    "";
  const name =
    workspaceProp?.name ??
    workspaceFromContext?.name ??
    slug;
  const logo = workspaceProp?.logo ?? workspaceFromContext?.logo;
  const isOwner = workspaceFromContext?.isOwner ?? true;

  const [deleting, setDeleting] = useState(false);
  const [slugVerification, setSlugVerification] = useState("");
  const [internalOpen, setInternalOpen] = useState(true);

  const isControlled =
    showModal !== undefined || showDeleteWorkspaceModal !== undefined;
  const isOpen = showModal ?? showDeleteWorkspaceModal ?? internalOpen;

  const handleClose = useCallback(() => {
    setShowModal?.(false);
    setShowDeleteWorkspaceModal?.(false);
    setInternalOpen(false);
    onClose?.();
  }, [setShowModal, setShowDeleteWorkspaceModal, onClose]);

  const setShowModalState = useCallback(
    (state: SetStateAction<boolean>) => {
      const next = typeof state === "function" ? state(isOpen) : state;
      if (!next) {
        handleClose();
      }
    },
    [isOpen, handleClose],
  );

  useEffect(() => {
    if (!isOpen) {
      setSlugVerification("");
    }
  }, [isOpen]);

  const isSlugVerified = Boolean(slug) && slugVerification === slug;

  async function deleteWorkspace() {
    return new Promise((resolve, reject) => {
      setDeleting(true);
      fetch(`/api/workspaces/${id || slug}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
      })
        .then(async (res) => {
          if (res.ok) {
            await Promise.all([mutate("/api/workspaces"), update?.()]);
            handleClose();
            onSuccess?.();
            router.push("/workspaces");
            resolve(null);
          } else {
            setDeleting(false);
            const data = await res.json().catch(() => ({}));
            reject(data?.error?.message ?? "Failed to delete workspace.");
          }
        })
        .catch((err) => {
          setDeleting(false);
          reject(err?.message ?? "Failed to delete workspace.");
        });
    });
  }

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!isSlugVerified || !isOwner) return;

    toast.promise(deleteWorkspace(), {
      loading: "Deleting workspace...",
      success: "Workspace deleted successfully!",
      error: (err) => err,
    });
  };

  return (
    <Modal
      showModal={isOpen}
      setShowModal={isControlled ? setShowModalState : undefined}
      onClose={handleClose}
      className="max-w-md"
    >
      <div className="space-y-2 border-b border-neutral-200 px-4 py-4 sm:px-6">
        <h3 className="text-lg font-medium">Delete Workspace</h3>
        <p className="text-sm text-neutral-500">
          Warning: This will permanently delete your workspace, custom domains,
          and all associated links and their respective analytics.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col bg-neutral-50">
        <div className="flex flex-col space-y-4 px-4 py-4 sm:px-6">
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

            <div className="flex min-w-0 flex-1 flex-col gap-0.5">
              <h3 className="line-clamp-1 text-sm font-medium text-neutral-600">
                {name || slug}
              </h3>
              <p className="truncate text-xs font-medium text-neutral-500">
                app.dub.co/{slug}
              </p>
            </div>
          </div>

          <div>
            <label
              htmlFor="workspace-slug"
              className="block text-sm text-neutral-700"
            >
              Enter the workspace slug{" "}
              <span className="font-semibold text-neutral-900">{slug}</span> to
              continue:
            </label>
            <div className="relative mt-1 rounded-md shadow-sm">
              <input
                type="text"
                name="workspace-slug"
                id="workspace-slug"
                autoFocus={!isMobile}
                autoComplete="off"
                pattern={slug || undefined}
                required
                disabled={!isOwner}
                value={slugVerification}
                onChange={(e) => setSlugVerification(e.target.value)}
                className={cn(
                  "block w-full rounded-md border-neutral-300 text-neutral-900 placeholder-neutral-400 focus:border-neutral-500 focus:outline-none focus:ring-neutral-500 sm:text-sm",
                  {
                    "cursor-not-allowed bg-neutral-100": !isOwner,
                  },
                )}
              />
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 border-t border-neutral-200 px-4 py-4 sm:px-6">
          <Button
            type="button"
            variant="secondary"
            text="Cancel"
            className="h-9 w-fit"
            onClick={handleClose}
            disabled={deleting}
          />
          <Button
            type="submit"
            text="Delete workspace"
            variant="danger"
            loading={deleting}
            disabled={!isSlugVerified || !isOwner}
            className="h-9 w-fit"
            {...(!isOwner && {
              disabledTooltip: "Only workspace owners can delete a workspace.",
            })}
          />
        </div>
      </form>
    </Modal>
  );
}

export function useDeleteWorkspaceModal(props?: DeleteWorkspaceModalProps) {
  const [showDeleteWorkspaceModal, setShowDeleteWorkspaceModal] =
    useState(false);

  const DeleteWorkspaceModalCallback = useCallback(() => {
    return (
      <DeleteWorkspaceModal
        showModal={showDeleteWorkspaceModal}
        setShowModal={setShowDeleteWorkspaceModal}
        showDeleteWorkspaceModal={showDeleteWorkspaceModal}
        setShowDeleteWorkspaceModal={setShowDeleteWorkspaceModal}
        {...props}
      />
    );
  }, [showDeleteWorkspaceModal, props]);

  return useMemo(
    () => ({
      setShowDeleteWorkspaceModal,
      DeleteWorkspaceModal: DeleteWorkspaceModalCallback,
    }),
    [DeleteWorkspaceModalCallback],
  );
}

export default DeleteWorkspaceModal;
