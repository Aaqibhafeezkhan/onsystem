// Menus as React Aria's starter ships them: MenuTrigger takes the button that opens the menu,
// SubmenuTrigger the item that opens the submenu.
import {
  Menu as AriaMenu,
  MenuItem as AriaMenuItem,
  MenuTrigger as AriaMenuTrigger,
  SubmenuTrigger as AriaSubmenuTrigger,
  type MenuItemProps,
  type MenuProps,
  type MenuTriggerProps,
} from "react-aria-components"

/** Opens its menu from the button inside it. */
export const MenuTrigger = AriaMenuTrigger

/** Opens a submenu from the item inside it. */
export const SubmenuTrigger = AriaSubmenuTrigger

/** A list of actions. */
export function Menu<T extends object>(props: MenuProps<T>) {
  return <AriaMenu className="rounded-md bg-background p-1" {...props} />
}

/** One action in a menu. */
export function MenuItem(props: MenuItemProps) {
  return <AriaMenuItem className="rounded-sm px-2 py-1 text-sm" {...props} />
}

/** Opens its menu on a right-click in the area it wraps. */
export function ContextMenuTrigger(props: MenuTriggerProps) {
  return <AriaMenuTrigger {...props} />
}
