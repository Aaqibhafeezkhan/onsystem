"use client";

import useWorkspace from "@/lib/swr/use-workspace";
import {
  BlurImage,
  Button,
  Input,
  Label,
  Logo,
  Modal,
  useMediaQuery,
} from "@dub/ui";
import { cn } from "@dub/utils";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import {
  Dispatch,
  SetStateAction,
  useCallback,
  useMemo,
  useState,
} from "react";
import { toast } from "sonner";
import { mutate } from "swr";

interface DeleteWorkspaceModalProps {
  showDeleteWorkspaceModal?: boolean;
  setShowDeleteWorkspaceModal?: Dispatch<SetStateAction<boolean>>;
  showModal?: boolean;
  setShowModal?: Dispatch<SetStateAction<boolean>> | ((show: boolean) => void);
}

export function DeleteWorkspaceModal({
  showDeleteWorkspaceModal,
  setShowDeleteWorkspaceModal,
  showModal: propsShowModal,
  setShowModal: propsSetShowModal,
}: DeleteWorkspaceModalProps) {
  const { update } = useSession();
  const router = useRouter();
  const { id, isOwner, name, logo, slug } = useWorkspace();

  const [deleting, setDeleting] = useState(false);
  const [workspaceSlugVerification, setWorkspaceSlugVerification] = useState("");

  const showModal = showDeleteWorkspaceModal ?? propsShowModal ?? false;
  const setShowModal =
    setShowDeleteWorkspaceModal ?? propsSetShowModal ?? (() => {});

  const isSlugVerified = workspaceSlugVerification === slug;

  async function deleteWorkspace() {
    return new Promise((resolve, reject) => {
      setDeleting(true);
      fetch(`/api/workspaces/${id}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
      }).then(async (res) => {
        if (res.ok) {
          await Promise.all([mutate("/api/workspaces"), update()]);
          router.push("/workspaces");
          resolve(null);
        } else {
          setDeleting(false);
          const { error } = await res.json();
          reject(error?.message || "Failed to delete workspace");
        }
      });
    });
  }

  const { isMobile } = useMediaQuery();

  return (
    <Modal showModal={showModal} setShowModal={setShowModal} className="max-w-md">
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

        <div className="grid gap-1.5">
          <Label htmlFor="workspace-slug">
            To verify, type the workspace slug{" "}
            <span className="font-semibold">{slug}</span> below:
          </Label>
          <Input
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
            className={cn({
              "cursor-not-allowed bg-neutral-100": !isOwner,
            })}
          />
        </div>

        <div className="mt-6 flex items-center justify-end gap-2 border-t border-neutral-200 pt-4">
          <Button
            type="button"
            variant="secondary"
            text="Cancel"
            className="h-9 w-fit"
            onClick={() => setShowModal(false)}
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
