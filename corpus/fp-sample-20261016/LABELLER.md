# Labeller notes: blind labels for the onsystem sample

## Who

- **Labeller:** an AI reviewer, model id `claude-opus-5-5`, running as a Claude Code agent (a subagent with read-only use of the GitHub API and public tarballs).
- **Date:** 2026-10-15.
- **Output:** `sample-labelled.json`, with the same 80 findings in the same order as `sample-unlabelled.json`. Each finding gains five fields: `label` (TP / FP / debatable), `own_ds_value`, `replacement_wrong`, `reason` and `looked_at`.
- **Not done here:** rates or any other statistics.

## What I saw

- **The sample.** `sample-unlabelled.json`, the only file of the draw's working folder that I opened.
  - I did run one `ls` of `fp-sample/` at the start, which showed the other file names. I opened none of them.
- **The rules doc.** onsystem `docs/rules.md` at `main`, read-only through the GitHub API. I read only:
  - the intro and rules table;
  - the "How fixes are chosen" section.

  I skipped "Known limits" and "Suppressing findings".

- **The pinned repos, read-only at their pinned commits:**
  - **How I read them.** I downloaded source tarballs from codeload.github.com into a scratch directory and read them with grep and sed. None of their code was run, built or installed.
  - **Which repos:**
    - dubinc/dub `70c96f9`, the whole repo;
    - midday-ai/midday `5158731`: `apps/dashboard/src`, `packages/ui/src` and `packages/invoice/src`;
    - calcom/cal.com `54343aa`: TS, TSX, CSS and JSON. The archive root at this commit is named `cal.diy`.
    - documenso/documenso `38ecb21`;
    - vercel/chatbot `c2f8235`;
    - nextjs/saas-starter `6e33e58`;
    - FlowiseAI/Flowise `9291856`: `packages/ui/src`, plus `packages/ui/package.json` and the theme overrides.
- **What I looked at in each repo:**
  - the full file of every finding;
  - the project's theme and CSS variables (Tailwind config, `themes.css`, `tokens.css`, `globals.css`);
  - its component library (`packages/ui`, `components/ui`, `@documenso/ui` primitives, MUI usage);
  - counts of how often the project uses each raw class against its tokens or components.
- **Other read-only GitHub API calls:**
  - the repo trees;
  - the commit history of dub's two theme files;
  - the diffs of dub's ten most recent commits before the pin, to see whether new code is written with tokens or with the neutral palette.

## What I did not see

I followed the independence rules strictly.

- **Not opened in the sample directory:**
  - `sample-key.json`, `population-index.json` and `population-summary.json`;
  - `ALLOCATION.md` and `allocation.json`;
  - the `fp-sample/scripts/` folder.
- **Not opened elsewhere in that working folder:** briefs, evaluation data and plans.
- **Not opened elsewhere:**
  - nothing in the temporary folders other sessions wrote;
  - onsystem's `corpus/labels.json` and `corpus/snapshot.json`;
  - the README paragraph on false positives;
  - any earlier sample or rate.
- **Never visible:** the linter's suggested fixes, since the sample does not include them. I judged only the message's claim.
- **No web search.**
- **No credential files** were read, and nothing was written to GitHub.

## Rubric

I applied the brief's definitions:

- **TP** means a maintainer who cares about that project's design system would want the finding flagged, and the message's claim is correct.
- **FP** means the code is fine as written, or the claim is false.
- **debatable** means reasonable maintainers would disagree, or the answer depends on intent I cannot see.

### Working rules

To keep 80 judgements consistent, I used these rules:

1. **Exact token, fitting role → TP.**
   - A raw palette class or hex that matches a project token exactly, where the token's role (text, surface, border) fits the use, is TP.
   - This holds even when the project's own design-system package still uses the raw class. `own_ds_value: true` records that nuance so the statistics step can split on it.
   - In practice this covers dub's `neutral-*` classes against its `bg-*`, `border-*` and `content-*` tokens. Those tokens are defined with exactly the neutral values (`packages/tailwind-config/themes.css`).
2. **No fitting token, value is intentional → FP.**
   - **The DS's own value:** for example, dub's Input uses `focus:border-red-500` for errors and there is no error-border token.
   - **Special-purpose colour:** decorative gradients, inline styles in an email-copy preview, or status palettes in a project with no status tokens (midday's invoice statuses, documenso's success green).
3. **Debatable cases.** I labelled a finding debatable when:
   - the nearest token is one shade off (dub `neutral-600`, `neutral-800` and `neutral-950`);
   - the project has a token for the role but deliberately uses another hue by convention (dub's amber warnings against its yellow `content-warning`);
   - the token matches the value but its role conflicts with the code's evident intent;
   - there is no token for this exact role, but there is one used for the same purpose elsewhere in the DS (dub input focus `neutral-500` against the Button's `border-emphasis` focus).
4. **Component rules** (`prefer-design-system-component`):
   - TP when the DS component exists and fits the element;
   - FP when the DS has no such component (dub's "TextArea" is an icon);
   - debatable when the named component exists but its variants do not fit the element's role (a menu row, a tiny inline text trigger).

   Whether the named replacement is wrong is recorded separately in `replacement_wrong`.

5. **`icon-button-accessible-name`:** TP when the button really contains only an icon and has no `aria-label`, `title` or sr-only text.
6. **`own_ds_value`:**
   - true when the flagged value appears deliberately in the project's design-system package source or in its theme or CSS variables;
   - false when it does not;
   - null for rules that are not about a value (component, prop, variant, accessible name).
7. **`replacement_wrong`:**
   - null when the message names no replacement, as with "pick the semantic token that fits" or "no token has this hue";
   - true only when the named replacement is factually wrong (an icon offered as a textarea, a 6px radius offered for 4px when a 4px token exists, FormLabel where the project's pattern is FormControlLabel);
   - false otherwise, including exact-value replacements whose role I flagged as questionable in the reason.

A note on the delta-E figures: dub uses Tailwind v3. Some messages report a delta-E of about 0.007 to 0.024 for `neutral-400` or `green-600`, but under v3 those classes are byte-exact matches for the tokens. I treated them as exact.

## Time taken

About 25 minutes of wall-clock time, from the first read of the sample to writing these notes. Most of it went on downloading and grepping the seven codebases and checking theme values and line numbers.

## Findings I found hard

### The dub-wide question

58 of the 80 findings are in dub, and 42 of those are exact-match `neutral-*` classes that I labelled TP. The evidence pulls both ways.

**For TP:**

- dub defines semantic light/dark tokens with exactly these values.
- Its core DS Button has moved to them (`packages/ui/src/button.tsx` L12-L16).
- Several flagged class strings already mix the two styles, e.g. `border-border-subtle` next to `text-neutral-900` (S40, S67, S21).

**Against:**

- apps/web still has about 8,300 neutral classes against about 1,700 token classes.
- `packages/ui` itself still uses the neutral palette heavily (Input, Badge, Modal).
- Recent commits still add mostly neutral classes.
- Dark mode only runs on `/embed/referrals`.

**My decision:** TP, because the rubric asks about a maintainer who cares about the design system, and the tokens exist for exactly this. Every one of these findings carries `own_ds_value: true` so the call can be revisited statistically.

### Individual findings

- **S01:** `bg-neutral-900` → `bg-inverted` on a marketing photo card that is meant to be dark in every theme (white text, white-logo filter). It matches in value, but the token's role conflicts with the intent. Labelled debatable.
- **S10 and S27:** dub's input focus colour (`neutral-500`) has no token, but the Button uses `border-emphasis` for focus. Labelled debatable. S26 (the error focus border) has no comparable token anywhere, so it is FP.
- **S19:** a native label wrapping a native checkbox in Flowise. Flagging it as off-system is right, but FormLabel is the wrong component; the project uses FormControlLabel + Checkbox. Labelled TP with `replacement_wrong: true`.
- **S28 and S78:** dub's amber warnings against its yellow warning token. Labelled debatable.
- **S51:** cal.com `decoration-gray-400`. The value is a cal token (text-muted), but tokens are exposed only for `text-*` and `border-*`, so nothing can colour a decoration. Labelled debatable.
- **S64:** `hover:bg-blue-100` is exactly dub's `bg-info`, but it is used on an interactive chip, not on info-status UI. Labelled debatable.
- **S02:** midday `#878787` is the de facto secondary text grey, used by its own DialogDescription. It has no token, and `muted-foreground` is visibly darker. Labelled debatable.
- **S14:** cal.com `rounded-[4px]` was called "off the scale", but `--radius-cal` is 4px. Labelled FP with `replacement_wrong: true`.
- **S08:** a correct claim, `gap-[70px]` = `gap-17.5` on Tailwind v4, but in a platform example app. Labelled debatable.
- **S57 and S65:** native buttons whose DS Button variants do not fit the element (a listbox row; a tiny inline text trigger). Labelled debatable. S68, a bordered icon button, fits Button and is TP.
- **S43:** `PaymentFormComponent` is declared nowhere in the cal.com repo, a real broken reference. The rule is about component names rather than design-system values, but the claim is correct. Labelled TP.
