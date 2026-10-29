"use client"
import {
  TextField as RACTextField,
  type TextFieldProps as RACTextFieldProps,
  type ValidationResult,
} from "react-aria-components"

import { Description, FieldError, Input, Label } from "./Field"
import { composeTailwindRenderProps } from "./utils"

export interface TextFieldProps extends RACTextFieldProps {
  label?: string
  description?: string
  errorMessage?: string | ((validation: ValidationResult) => string)
  placeholder?: string
}

/**
 * A labelled text input. Use `isRequired` and `isDisabled` (React Aria's
 * names), not `required` and `disabled`.
 */
export function TextField({
  label,
  description,
  errorMessage,
  placeholder,
  ...props
}: TextFieldProps) {
  return (
    <RACTextField
      {...props}
      className={composeTailwindRenderProps(
        props.className,
        "flex flex-col gap-1"
      )}
    >
      {label && <Label>{label}</Label>}
      <Input placeholder={placeholder} />
      {description && <Description>{description}</Description>}
      <FieldError>{errorMessage}</FieldError>
    </RACTextField>
  )
}
