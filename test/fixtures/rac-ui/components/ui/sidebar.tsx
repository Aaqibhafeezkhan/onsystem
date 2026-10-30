// shadcn/ui's sidebar on React Aria: the menu button is a link when it has an href. Its render
// prop's type comes out spelled out, ((props: …) => …), rather than as DOMRenderFunction.
import {
  Button as AriaButton,
  Link as AriaLink,
  type ButtonProps,
  type LinkProps,
} from "react-aria-components"

type SidebarButtonProps = (LinkProps & { href: string }) | (ButtonProps & { href?: never })

/** A button in the sidebar's menu, or a link when it has an href. */
export function SidebarMenuButton({
  isActive = false,
  ...props
}: SidebarButtonProps & { isActive?: boolean }) {
  return props.href !== undefined ? (
    <AriaLink data-active={isActive} className="flex rounded-md p-2 text-sm" {...props} />
  ) : (
    <AriaButton
      data-active={isActive}
      className="flex rounded-md p-2 text-sm"
      {...(props as ButtonProps)}
    />
  )
}
