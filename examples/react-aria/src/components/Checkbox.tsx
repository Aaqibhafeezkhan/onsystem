"use client"
// Adapted from React Aria's Tailwind starter (Apache-2.0, see ../../LICENSE-react-aria), changed for this example.
import {
  Checkbox as RACCheckbox,
  composeRenderProps,
  type CheckboxProps,
} from "react-aria-components"
import { tv } from "tailwind-variants"

import { composeTailwindRenderProps, focusRing } from "./utils"

const box = tv({
  extend: focusRing,
  base: "flex size-5 shrink-0 items-center justify-center rounded border-2 transition",
  variants: {
    isSelected: {
      false: "border-border bg-background",
      true: "border-transparent bg-primary text-primary-foreground",
    },
    isInvalid: {
      true: "border-destructive",
    },
    isDisabled: {
      true: "opacity-50",
    },
  },
})

/** A checkbox with its label. Use `isSelected` or `defaultSelected`, not `checked`. */
export function Checkbox(props: CheckboxProps) {
  return (
    <RACCheckbox
      {...props}
      className={composeTailwindRenderProps(
        props.className,
        "flex items-center gap-2 text-sm text-foreground"
      )}
    >
      {composeRenderProps(
        props.children,
        (children, { isSelected, isInvalid, isDisabled, isFocusVisible }) => (
          <>
            <div
              className={box({
                isSelected,
                isInvalid,
                isDisabled,
                isFocusVisible,
              })}
            >
              {isSelected && (
                <svg
                  viewBox="0 0 18 18"
                  aria-hidden="true"
                  className="size-4 fill-none stroke-current stroke-2"
                >
                  <polyline points="2 9 7 14 16 4" />
                </svg>
              )}
            </div>
            {children}
          </>
        )
      )}
    </RACCheckbox>
  )
}
