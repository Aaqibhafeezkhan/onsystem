// Reading the docs' Markdown in tests that check what a page says against the code.

/** The text under `## <heading>`, up to the next `## ` heading. */
export function section(markdown: string, heading: string): string {
  const start = markdown.indexOf(`\n## ${heading}\n`);
  if (start === -1) throw new Error(`no "## ${heading}" section`);
  const end = markdown.indexOf('\n## ', start + 1);
  return markdown.slice(start, end === -1 ? undefined : end);
}

/** The fenced code blocks of one language, in order. */
export function blocks(markdown: string, lang: string): string[] {
  return [...markdown.matchAll(new RegExp(`\`\`\`${lang}[^\\n]*\\n([\\s\\S]*?)\`\`\``, 'g'))].map(
    (m) => m[1] ?? '',
  );
}
