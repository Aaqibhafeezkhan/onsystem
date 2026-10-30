---
'onsystem': patch
---

An unknown component that looks like a part of a family the design system has, but is like none of its parts, is no longer taken for the part spelled closest. `DialogContent` in a design system on React Aria, whose `Dialog` is the content, got "Did you mean <DialogFooter>?"; it now gets "Did you mean <Dialog>, or one of its parts: DialogTrigger, DialogHeader, DialogFooter, DialogTitle?", with no rename. A misspelled part (`DialogTitel`) is still taken for that part.

`asChild` on a React Aria trigger (`<DialogTrigger asChild>`) now says that the trigger takes the element that opens it as a child. On a React Aria component whose `render` is a function, `asChild`, `as`, `component` and `href` no longer get Base UI's advice (`render={<Link href="…" />}`), which React Aria's `render` does not take: they say to use a link component for a link.

The ESLint plugin no longer waits two minutes on each file when its loader worker stops before it answers, as `process.exit()` in an `onsystem.config.mjs` or an uncaught error makes it: the lint fails at once with "the design system's loader stopped before it answered", and why.
