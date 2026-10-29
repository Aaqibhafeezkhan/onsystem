"use client"
import {
  composeRenderProps,
  Switch as RACSwitch,
  type SwitchProps,
} from "react-aria-components"
import { tv } from "tailwind-variants"

import { composeTailwindRenderProps, focusRing } from "./utils"

const track = tv({
  extend: focusRing,
  base: "flex h-5 w-9 shrink-0 cursor-default items-center rounded-full px-0.5 transition",
  variants: {
    isSelected: {
      false: "bg-border",
      true: "bg-primary",
    },
    isDisabled: {
      true: "opacity-50",
    },
  },
})

/** An on/off setting that applies at once. Use `isSelected`, not `checked`. */
export function Switch(props: SwitchProps) {
  return (
    <RACSwitch
      {...props}
      className={composeTailwindRenderProps(
        props.className,
        "flex items-center gap-2 text-sm text-foreground"
      )}
    >
      {composeRenderProps(
        props.children,
        (children, { isSelected, isDisabled, isFocusVisible }) => (
          <>
            <div className={track({ isSelected, isDisabled, isFocusVisible })}>
              <span
                className={`size-4 rounded-full bg-background shadow transition ${isSelected ? "translate-x-4" : ""}`}
              />
            </div>
            {children}
          </>
        )
      )}
    </RACSwitch>
  )
}
