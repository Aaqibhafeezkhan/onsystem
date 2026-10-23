---
'onsystem': patch
---

`onsystem export --format design-md` keeps each table row on one line. A token whose comment or value the stylesheet wraps over several lines, such as a two-part `--shadow-lg`, broke its row: GitHub showed the rest of it as a code block and every later row in that table as a paragraph. The lines are now joined with spaces.
