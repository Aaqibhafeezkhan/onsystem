"use client"
// Adapted from React Aria's Tailwind starter (Apache-2.0, see ../../LICENSE-react-aria), changed for this example.
import {
  Button as RACButton,
  composeRenderProps,
  type ButtonProps as RACButtonProps,
} from "react-aria-components"
import { tv } from "tailwind-variants"

import { focusRing } from "./utils"

export interface ButtonProps extends RACButtonProps {
  variant?: "primary" | "secondary" | "destructive" | "quiet"
}

const button = tv({
  extend: focusRing,
  base: "cursor-default rounded-lg px-5 py-2 text-center text-sm transition",
  variants: {
    variant: {
      primary: "bg-primary text-primary-foreground hover:bg-primary-hover",
      secondary:
        "border border-border bg-background text-foreground hover:bg-muted",
      destructive:
        "bg-destructive text-primary-foreground hover:bg-destructive-hover",
      quiet: "bg-transparent text-foreground hover:bg-muted",
    },
    isDisabled: {
      true: "opacity-50",
    },
  },
  defaultVariants: {
    variant: "primary",
  },
})

/**
 * Triggers an action. Use `variant="destructive"` for irreversible actions,
 * and `isDisabled` and `onPress` (React Aria's names) rather than `disabled`
 * and `onClick`.
 */
export function Button(props: ButtonProps) {
  return (
    <RACButton
      {...props}
      className={composeRenderProps(props.className, (className, renderProps) =>
        button({ ...renderProps, variant: props.variant, className })
      )}
    />
  )
}
