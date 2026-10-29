"use client"
// Adapted from React Aria's Tailwind starter (Apache-2.0, see ../../LICENSE-react-aria), changed for this example.
import {
  Dialog as RACDialog,
  Heading,
  type DialogProps,
  type HeadingProps,
} from "react-aria-components"
import { twMerge } from "tailwind-merge"

/** A dialog's content, inside a `<Modal>` and a `<DialogTrigger>`. */
export function Dialog(props: DialogProps) {
  return (
    <RACDialog
      {...props}
      className={twMerge(
        "relative overflow-auto p-6 outline-0",
        props.className
      )}
    />
  )
}

/** The dialog's title, which also names it for assistive technology. */
export function DialogTitle(props: HeadingProps) {
  return (
    <Heading
      {...props}
      slot="title"
      className={twMerge("text-lg font-semibold", props.className)}
    />
  )
}
