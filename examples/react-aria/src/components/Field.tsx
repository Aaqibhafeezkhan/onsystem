"use client"
// Adapted from React Aria's Tailwind starter (Apache-2.0, see ../../LICENSE-react-aria), changed for this example.
import {
  composeRenderProps,
  FieldError as RACFieldError,
  Input as RACInput,
  Label as RACLabel,
  Text,
  type FieldErrorProps,
  type InputProps,
  type LabelProps,
  type TextProps,
} from "react-aria-components"
import { twMerge } from "tailwind-merge"
import { tv } from "tailwind-variants"

import { composeTailwindRenderProps, focusRing } from "./utils"

export function Label(props: LabelProps) {
  return (
    <RACLabel
      {...props}
      className={twMerge(
        "text-sm font-medium text-foreground",
        props.className
      )}
    />
  )
}

export function Description(props: TextProps) {
  return (
    <Text
      {...props}
      slot="description"
      className={twMerge("text-sm text-muted-foreground", props.className)}
    />
  )
}

export function FieldError(props: FieldErrorProps) {
  return (
    <RACFieldError
      {...props}
      className={composeTailwindRenderProps(
        props.className,
        "text-sm text-destructive"
      )}
    />
  )
}

const input = tv({
  extend: focusRing,
  base: "rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground",
  variants: {
    isInvalid: {
      true: "border-destructive",
    },
    isDisabled: {
      true: "opacity-50",
    },
  },
})

export function Input(props: InputProps) {
  return (
    <RACInput
      {...props}
      className={composeRenderProps(props.className, (className, renderProps) =>
        input({ ...renderProps, className })
      )}
    />
  )
}
