---
'onsystem': patch
---

`no-hardcoded-color` reads tokens whose names start with `content-` (Dub's text colors) or `on-` (Material's) as text colors. `text-neutral-400` now matches Dub's `content-muted`, and `border-*`, `ring-*` and `bg-*` classes are no longer fixed to a text color. When the only close token is made for another role, the message names it ("content-subtle has this color, but it is meant for text") instead of saying that no token is close. A Tailwind palette class is now fixed only to a token of its own shade: `text-neutral-600` still gets `content-default` as the suggestion, but the finding carries no fix, so `eslint --fix` leaves it, since `content-default` is neutral-700 and would darken the text. Exact matches, and tokens that copy Tailwind v3's palette (`text-red-600` to a token holding v3's red-600), are still fixed.
