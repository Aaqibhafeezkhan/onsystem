"use client";

import useWorkspace from "@/lib/swr/use-workspace";
import { BlurImage, Button, Input, Label, Logo, Modal, useMediaQuery } from "@dub/ui";
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
  workspaceId?: string;
  workspaceSlug?: string;
  workspaceName?: string;
  workspaceLogo?: string | null;
  onDelete?: () => void;
}

export function DeleteWorkspaceModal({
  showModal: propShowModal,
  setShowModal: propSetShowModal,
  showDeleteWorkspaceModal,
  setShowDeleteWorkspaceModal,
  workspaceId: propWorkspaceId,
  workspaceSlug: propWorkspaceSlug,
  workspaceName: propWorkspaceName,
  workspaceLogo: propWorkspaceLogo,
  onDelete,
}: DeleteWorkspaceModalProps) {
  const router = useRouter();
  const params = useParams() as { slug?: string };
  const workspace = useWorkspace();

  const workspaceId = propWorkspaceId || workspace?.id;
  const workspaceSlug =
    propWorkspaceSlug || workspace?.slug || params?.slug || "";
  const workspaceName = propWorkspaceName || workspace?.name;
  const workspaceLogo =
    propWorkspaceLogo !== undefined ? propWorkspaceLogo : workspace?.logo;

  const showModal =
    propShowModal !== undefined
      ? propShowModal
      : showDeleteWorkspaceModal ?? false;
  const setShowModal =
    propSetShowModal || setShowDeleteWorkspaceModal || (() => {});

  const [deleting, setDeleting] = useState(false);
  const [verification, setVerification] = useState("");

  const isVerified = verification === workspaceSlug;
  const { isMobile } = useMediaQuery();

  async function handleDelete() {
    if (!workspaceId) {
      toast.error("Workspace ID not found");
      return;
    }
    setDeleting(true);
    try {
      const res = await fetch(`/api/workspaces/${workspaceId}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (res.ok) {
        await mutate("/api/workspaces");
        setShowModal(false);
        toast.success("Workspace deleted successfully!");
        onDelete?.();
        router.push("/workspaces");
      } else {
        const { error } = await res.json();
        toast.error(error?.message || "Failed to delete workspace");
      }
    } catch (err: any) {
      toast.error(err?.message || "Failed to delete workspace");
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
      <div className="space-y-2 border-b border-neutral-200 px-4 py-4 sm:px-6">
        <h3 className="text-lg font-medium text-neutral-900">
          Delete workspace
        </h3>
        <p className="text-sm text-neutral-500">
          Warning: This will permanently delete your workspace, custom domains,
          and all associated links and their respective analytics.
        </p>
      </div>

      <form
        onSubmit={async (e) => {
          e.preventDefault();
          await handleDelete();
        }}
        className="flex flex-col space-y-4 bg-neutral-50 px-4 py-4 sm:px-6"
      >
        <div className="relative flex items-center gap-3 rounded-md border border-neutral-300 bg-white px-4 py-2">
          {workspaceLogo ? (
            <BlurImage
              src={workspaceLogo}
              alt="Workspace logo"
              className="size-7 rounded-full"
              width={28}
              height={28}
            />
          ) : (
            <Logo className="size-7 text-neutral-500" />
          )}

          <div className="flex flex-1 flex-col gap-0.5">
            <h3 className="line-clamp-1 text-sm font-medium text-neutral-600">
              {workspaceName || workspaceSlug}
            </h3>
            <p className="text-xs font-medium text-neutral-500">
              app.dub.co/{workspaceSlug}
            </p>
          </div>
        </div>

        <div>
          <Label htmlFor="workspace-slug-verification">
            To verify, type <span className="font-semibold">{workspaceSlug}</span>{" "}
            below:
          </Label>
          <div className="relative mt-1">
            <Input
              type="text"
              name="workspace-slug-verification"
              id="workspace-slug-verification"
              required
              autoFocus={!isMobile}
              autoComplete="off"
              value={verification}
              onChange={(e) => setVerification(e.target.value)}
              placeholder={workspaceSlug}
            />
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 pt-2">
          <Button
            type="button"
            variant="secondary"
            text="Cancel"
            onClick={() => setShowModal(false)}
            disabled={deleting}
          />
          <Button
            type="submit"
            text="Delete workspace"
            variant="danger"
            loading={deleting}
            disabled={!isVerified}
          />
        </div>
      </form>
    </Modal>
  );
}

export function useDeleteWorkspaceModal() {
  const [showModal, setShowModal] = useState(false);

  const DeleteWorkspaceModalCallback = useCallback(() => {
    return <DeleteWorkspaceModal showModal={showModal} setShowModal={setShowModal} />;
  }, [showModal]);

  return useMemo(
    () => ({
      setShowDeleteWorkspaceModal: setShowModal,
      DeleteWorkspaceModal: DeleteWorkspaceModalCallback,
    }),
    [showModal, DeleteWorkspaceModalCallback],
  );
}
