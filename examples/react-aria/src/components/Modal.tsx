"use client"
import {
  ModalOverlay,
  Modal as RACModal,
  type ModalOverlayProps,
} from "react-aria-components"

/** The overlay a `<Dialog>` opens in. */
export function Modal(props: ModalOverlayProps) {
  return (
    <ModalOverlay
      {...props}
      className="fixed inset-0 z-10 flex min-h-full items-center justify-center bg-black/30 p-4"
    >
      <RACModal
        {...props}
        className="w-full max-w-md rounded-2xl border border-border bg-background shadow-2xl"
      />
    </ModalOverlay>
  )
}
