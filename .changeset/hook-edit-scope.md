---
'onsystem': patch
---

The Claude Code hook no longer blocks an Edit on findings that were already in the file. It holds an Edit to the lines it changed: those Claude Code's own diff of the edit adds, or else where its new text is in the file, without the unchanged lines it repeats around the change, in files with Windows line endings too. When it cannot tell which lines an Edit changed, because the new text is in the file more than once (a lone `}`) or a formatter rewrote it, the findings go to Claude as a note that does not block, where they used to block the edit with the whole file's older errors. An Edit that only removes text is not held to older findings either, and a short new text in a long file no longer slows the hook down.
