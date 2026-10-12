import useWorkspace from "@/lib/swr/use-workspace";
import { BlurImage, Button, Logo, Modal, useMediaQuery } from "@dub/ui";
import { useSession } from "next-auth/react";
import { useParams, useRouter } from "next/navigation";
import { Dispatch, FormEvent, SetStateAction, useState } from "react";
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
  const { slug } = useParams() as { slug: string };
  const { id, isOwner, name, logo } = useWorkspace();
  const { isMobile } = useMediaQuery();
  const [workspaceSlug, setWorkspaceSlug] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);

  const deleteWorkspace = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (workspaceSlug !== slug || !isOwner || isDeleting) return;

    setIsDeleting(true);
    try {
      const response = await fetch(`/api/workspaces/${id}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
      });

      if (!response.ok) {
        const { error } = await response.json();
        throw new Error(error.message);
      }

      await Promise.all([mutate("/api/workspaces"), update()]);
      setShowModal(false);
      router.push("/workspaces");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Modal showModal={showModal} setShowModal={setShowModal} className="max-w-md">
      <div className="space-y-2 border-b border-neutral-200 px-4 py-4 sm:px-6">
        <h3 className="text-lg font-medium">Delete workspace</h3>
        <p className="text-sm text-neutral-500">
          This will permanently delete your workspace, custom domains, and all
          associated links and analytics. This action cannot be undone.
        </p>
      </div>

      <form
        onSubmit={(event) => {
          toast.promise(deleteWorkspace(event), {
            loading: "Deleting workspace...",
            success: "Workspace deleted successfully!",
            error: (error) => error.message,
          });
        }}
        className="flex flex-col gap-4 bg-neutral-50 px-4 py-4 sm:px-6"
      >
        <div className="flex items-center gap-3 rounded-md border border-neutral-300 bg-white px-4 py-2">
          {logo ? (
            <BlurImage
              src={logo}
              alt="Workspace logo"
              className="size-7 rounded-full"
              width={28}
              height={28}
            />
          ) : (
            <Logo className="size-7 text-neutral-500" />
          )}
          <div className="flex min-w-0 flex-1 flex-col gap-0.5">
            <p className="line-clamp-1 text-sm font-medium text-neutral-600">
              {name || slug}
            </p>
            <p className="text-xs font-medium text-neutral-500">app.dub.co/{slug}</p>
          </div>
        </div>

        <div>
          <label htmlFor="workspace-slug" className="block text-sm text-neutral-700">
            Type the workspace slug <span className="font-semibold">{slug}</span> to confirm.
          </label>
          <input
            id="workspace-slug"
            name="workspace-slug"
            type="text"
            required
            autoFocus={!isMobile}
            autoComplete="off"
            disabled={!isOwner || isDeleting}
            value={workspaceSlug}
            onChange={(event) => setWorkspaceSlug(event.target.value)}
            className="mt-1 block w-full rounded-md border-neutral-300 text-neutral-900 placeholder-neutral-300 focus:border-neutral-500 focus:outline-none focus:ring-neutral-500 sm:text-sm disabled:cursor-not-allowed disabled:bg-neutral-100"
          />
        </div>

        <div className="flex justify-end gap-2 border-t border-neutral-200 pt-4">
          <Button
            type="button"
            variant="secondary"
            text="Cancel"
            className="h-9 w-fit"
            onClick={() => setShowModal(false)}
            disabled={isDeleting}
          />
          <Button
            type="submit"
            variant="danger"
            text="Delete workspace"
            className="h-9 w-fit"
            loading={isDeleting}
            disabled={workspaceSlug !== slug || !isOwner}
            {...(!isOwner && {
              disabledTooltip: "Only workspace owners can delete a workspace.",
            })}
          />
        </div>
      </form>
    </Modal>
  );
}
