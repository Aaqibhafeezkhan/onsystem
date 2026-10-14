---
'onsystem': patch
---

`eslint --fix` no longer leaves files that do not compile. The ESLint plugin used to apply every fix, so a rename to a component the file does not import (`<button>` to `<Button>`, `<Card.Header>` to `<CardHeader>`) broke the build under lint-staged or fix-on-save. Such a rename is now an ESLint suggestion, which the editor offers and you apply, and the message still names the import to add. Renames to a component the file imports from the design system are fixed as before; a name it imports from elsewhere (`Table` from @tanstack/react-table, an app's own `Label`) or declares only as a type does not count.
