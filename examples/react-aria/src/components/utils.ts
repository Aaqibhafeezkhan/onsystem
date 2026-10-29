// Adapted from React Aria's Tailwind starter (Apache-2.0, see ../../LICENSE-react-aria), changed for this example.
import { composeRenderProps } from "react-aria-components"
import { twMerge } from "tailwind-merge"
import { tv } from "tailwind-variants"

/** The focus ring every focusable component shows for keyboard focus. */
export const focusRing = tv({
  base: "outline outline-offset-2 outline-primary",
  variants: {
    isFocusVisible: {
      false: "outline-0",
      true: "outline-2",
    },
  },
})

/** A component's own classes, merged with the `className` given to it. */
export function composeTailwindRenderProps<T>(
  className: string | ((v: T) => string) | undefined,
  tw: string
): string | ((v: T) => string) {
  return composeRenderProps(className, (className) => twMerge(tw, className))
}
