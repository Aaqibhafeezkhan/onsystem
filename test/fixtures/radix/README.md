The published type declarations (`dist/index.d.ts`) of the Radix packages behind
shadcn/ui's Accordion and ToggleGroup, unchanged, so tests read the real types without
installing them. MIT licensed (`LICENSE`).

| Package                         | Version |
| ------------------------------- | ------- |
| `@radix-ui/react-accordion`     | 1.3.1   |
| `@radix-ui/react-toggle-group`  | 1.2.1   |
| `@radix-ui/react-collapsible`   | 1.2.1   |
| `@radix-ui/react-context`       | 1.3.0   |
| `@radix-ui/react-primitive`     | 2.2.0   |
| `@radix-ui/react-roving-focus`  | 1.2.1   |
| `@radix-ui/react-toggle`        | 1.2.1   |

`Accordion` and `ToggleGroup` take a union of props,
`ForwardRefExoticComponent<(SingleProps | MultipleProps) & RefAttributes<HTMLDivElement>>`:
`type` is `"single"` in one member and `"multiple"` in the other.
