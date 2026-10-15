---
'onsystem': patch
---

`icon-button-accessible-name` no longer fixes a label that names the wrong action, which `eslint --fix` and the agent tools applied: an expand chevron in shadcn's sidebar blocks (`<CollapsibleTrigger asChild><SidebarMenuAction><ChevronRight /></SidebarMenuAction></CollapsibleTrigger>`) got `aria-label="Next"`, and X buttons that call `removeAssertion(index)` or `onRemove` got `aria-label="Close"`. Now:

- The label is fixed only for an icon that means one thing on a button, named plainly: a trash can ("Delete"), pencil ("Edit"), magnifier ("Search"), gear ("Settings"), copy, download, upload, share or filter icon (`Trash2`, `TrashIcon`; not `Binary`, `Copyright` or `FilterX`, which only start like one). A plus, a chevron or arrow, a menu icon and the rest are named in the message without a fix.
- "More options" is fixed on a menu's trigger (`DropdownMenuTrigger`, `Menu.Trigger`), and named without a fix elsewhere.
- An X is named by what its `onClick` (or `onPress`) calls: "Remove" for `remove(index)`, `onRemove` or `onDelete`, "Clear" for `clearSearch()` or `form.reset()`, "Close" for `onClose`, `setOpen(false)` or `toast.dismiss(id)`, and fixed. In a close part (`DialogClose`) it is "Close", fixed; otherwise "Close" is named without a fix. A state setter (`setDeleteTarget(null)`) does not count as a name for the action.
- A chevron or arrow inside a collapsible's or accordion's trigger, or on a button with `aria-expanded`, `data-state` or `data-[state=open]:` classes, is named "Toggle" instead of "Next" or "Previous".
