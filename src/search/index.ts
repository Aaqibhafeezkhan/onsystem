import type { ComponentInfo } from '../types.js';
import { splitWords } from '../util/strings.js';
import { Bm25Index, type Bm25Hit } from './bm25.js';
import { expandQuery, tokenize } from './tokenize.js';

export { Bm25Index } from './bm25.js';
export { expandQuery, tokenize } from './tokenize.js';

export interface SearchHit {
  component: ComponentInfo;
  score: number;
  matched: string[];
  /** No hit clearly matches the query: this one has only a word or two in common with it. */
  weak?: true;
}

/** Field weights: names matter most, then descriptions and variant values. */
const WEIGHTS = { name: 4, description: 2.5, variants: 2, docs: 1, props: 1, examples: 0.5 };

/**
 * What the components of shadcn/ui's registry are for, by the name its file exports them
 * under (`Badge` in `badge.tsx`). Its files have no JSDoc, so without these a stock shadcn/ui
 * app lists every component as undescribed and search finds them by name alone.
 */
const SHADCN_DESCRIPTIONS: Record<string, string> = {
  Accordion: 'Stacked sections whose headings expand and collapse their content.',
  Alert: 'A callout that draws attention to a message, with an optional title and icon.',
  AlertDialog:
    'A modal dialog that asks the user to confirm an action, such as a deletion, before it happens.',
  AspectRatio: 'Keeps its content, such as an image or a video, at a fixed width-to-height ratio.',
  Avatar:
    "A user's picture, with a fallback such as initials while it loads or when it is missing.",
  Badge: 'A small label for a status, a count or a category.',
  Breadcrumb: 'The path to the current page, as a trail of links.',
  Button: 'Triggers an action, such as submitting a form or opening a dialog.',
  ButtonGroup: 'Joins related buttons into one bar.',
  Calendar: 'A month grid to pick a date or a range of dates.',
  Card: 'A bordered surface that groups related content, with a header, content and footer.',
  Carousel: 'Shows a row of slides one at a time, with previous and next buttons.',
  Checkbox: 'A box the user ticks to turn an option on or off.',
  Collapsible: 'Shows and hides a panel of content from a trigger.',
  Combobox: 'A text input with a list of options that narrows as the user types.',
  Command: 'A searchable list of commands or options, as in a command palette.',
  ContextMenu: 'A menu of actions that opens on right-click.',
  Dialog: 'A modal window over the page, for a task or a message that needs the user first.',
  Drawer: 'A panel that slides in from an edge of the screen, often from the bottom on phones.',
  DropdownMenu: 'A menu of actions or options that opens from a button.',
  Empty: 'An empty state: what to show when there is nothing yet, with an action to start.',
  Field: 'A form field: its label, control, description and error message together.',
  HoverCard: 'A card of preview content that opens while the pointer rests on a link.',
  Input: 'A single-line text field.',
  InputGroup: 'An input with icons, text or buttons inside its border.',
  InputOTP: 'A row of one-character slots for a one-time code.',
  Item: 'A row of content for lists: media, a title, a description and actions.',
  Kbd: 'Shows a keyboard key or shortcut.',
  Label: 'The text label of a form control.',
  Menubar: 'A horizontal bar of menus, as in a desktop app.',
  NativeSelect: 'A styled native <select> element.',
  NavigationMenu: "A site's main navigation links, with panels that open from them.",
  Pagination: 'Links to move between pages of results, with previous and next.',
  Popover: 'Rich content in a floating panel that opens from a button.',
  Progress: 'A bar that shows how far a task has got.',
  RadioGroup: 'A set of options of which the user picks exactly one.',
  ScrollArea: 'A scrollable region with styled scrollbars.',
  Select: 'Lets the user pick one value from a list that opens from a button.',
  Separator: 'A thin line between content, horizontal or vertical.',
  Sheet: 'A panel that slides in over the page from an edge of the screen, for secondary content.',
  Sidebar: "The app's side navigation: a collapsible panel of grouped menu items.",
  Skeleton: 'A placeholder shape shown while content loads.',
  Slider: 'Picks a number, or a range, by dragging along a track.',
  Spinner: 'An animated indicator that something is loading.',
  Switch: 'A toggle that turns a setting on or off at once.',
  Table: 'Rows and columns of data.',
  Tabs: 'Switches between panels of content, one visible at a time.',
  Textarea: 'A multi-line text field.',
  Toggle: 'A button that stays pressed or not, such as Bold in a toolbar.',
  ToggleGroup: 'A set of toggle buttons, of which one or several can be on.',
  Tooltip: 'A short hint that appears while the pointer rests on, or focus is in, an element.',
};

/**
 * The component's own description or, for a shadcn/ui component without one (`Badge`
 * exported from `badge.tsx`, no JSDoc), what the registry's component of that name is for.
 */
export function descriptionOf(component: ComponentInfo): string | undefined {
  if (component.description) return component.description;
  if (component.library || component.parent) return undefined;
  if (!Object.hasOwn(SHADCN_DESCRIPTIONS, component.name)) return undefined;
  const file = (component.source.file.split(/[\\/]/).pop() ?? '').replace(/\.[jt]sx?$/, '');
  const kebab = splitWords(component.name).join('-').toLowerCase();
  return file === kebab ? SHADCN_DESCRIPTIONS[component.name] : undefined;
}

export function buildSearchIndex(components: ComponentInfo[]): Bm25Index<ComponentInfo> {
  const index = new Bm25Index<ComponentInfo>();
  for (const component of components) {
    index.add(component, [
      [
        tokenize([component.name, ...component.aliases, component.parent ?? ''].join(' ')),
        WEIGHTS.name,
      ],
      [tokenize(descriptionOf(component) ?? ''), WEIGHTS.description],
      [
        tokenize(component.variants.flatMap((v) => [v.name, ...v.values]).join(' ')),
        WEIGHTS.variants,
      ],
      [
        tokenize((component.docs?.sections ?? []).map((s) => `${s.heading} ${s.body}`).join(' ')),
        WEIGHTS.docs,
      ],
      [
        tokenize(component.props.map((p) => `${p.name} ${p.description ?? ''}`).join(' ')),
        WEIGHTS.props,
      ],
      [tokenize(component.examples.map((e) => e.title ?? '').join(' ')), WEIGHTS.examples],
    ]);
  }
  return index;
}

/** The query's words, each with the terms that find it: `modal` is found by modal and dialog. */
function queryWords(query: string): { stems: string[]; terms: string[] }[] {
  const words = new Map<string, { stems: string[]; terms: string[] }>();
  for (const word of splitWords(query)) {
    const stems = tokenize(word);
    const key = stems.join(' ');
    if (stems.length && !words.has(key)) {
      words.set(key, { stems, terms: [...expandQuery(word).keys()] });
    }
  }
  return [...words.values()];
}

/**
 * Components for `query`, best first. A hit matches clearly when a word of the query is in
 * its name (`button` for Button) or when it has more than half of the query's words, each
 * itself or through a synonym (`modal` through `dialog`). The hits that do not are left out
 * when any does, and otherwise come back marked `weak`: "a dropdown menu to pick a country",
 * in a design system with no select, finds only a card's action slot that mentions a menu,
 * which is not an answer to give as the best match.
 */
export function searchComponents(
  index: Bm25Index<ComponentInfo>,
  query: string,
  limit = 5,
): SearchHit[] {
  const words = queryWords(query);
  const hits = index.search(expandQuery(query), index.size).map((hit: Bm25Hit<ComponentInfo>) => {
    const matched = new Set(hit.terms);
    const covered = words.filter((word) => word.terms.some((term) => matched.has(term))).length;
    const names = new Set(tokenize([hit.item.name, ...hit.item.aliases].join(' ')));
    const clear =
      covered * 2 > words.length || words.some((word) => word.stems.some((s) => names.has(s)));
    const found: SearchHit = {
      component: hit.item,
      score: Math.round(hit.score * 100) / 100,
      matched: hit.terms,
    };
    return { found, clear };
  });
  const clear = hits.filter((hit) => hit.clear);
  if (clear.length) return clear.slice(0, limit).map((hit) => hit.found);
  return hits.slice(0, limit).map((hit) => ({ ...hit.found, weak: true }));
}
