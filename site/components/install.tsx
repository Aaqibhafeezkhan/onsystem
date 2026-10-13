import { CodeBody } from '@/components/code';
import { CodeFrame } from '@/components/code-frame';
import { ArrowUpRightIcon, StarIcon } from '@/components/icons';
import { CURSOR_INSTALL, NPX, PLUGIN_COMMANDS, REPO, VSCODE_INSTALL } from '@/lib/site';

const link =
  'group flex min-h-11 items-center justify-between gap-1.5 rounded-lg border border-line bg-raised-2 px-3 py-2 text-[13px] font-medium sm:gap-2 sm:px-3.5 sm:text-sm text-fg transition-colors hover:border-line-strong hover:bg-raised-3';

/** Every way in, in the order most people need them: the plugin, one-click editors, any client. */
export function InstallPanel({ className = '' }: { className?: string }) {
  return (
    <div
      className={`grid gap-3 rounded-2xl border border-line bg-raised/90 p-3 shadow-[0_24px_80px_-32px_var(--site-shadow)] sm:p-4 ${className}`}
    >
      <CodeFrame
        title="Claude Code plugin"
        note={<span className="text-subtle max-sm:hidden">hook, server, skill</span>}
        copy={{ text: PLUGIN_COMMANDS, label: 'Copy the two plugin commands' }}
      >
        <CodeBody code={PLUGIN_COMMANDS} lang="text" />
      </CodeFrame>
      <div className="grid grid-cols-2 gap-3">
        <a href={CURSOR_INSTALL} className={link}>
          Install in Cursor
          <ArrowUpRightIcon className="size-4 shrink-0 text-subtle transition-colors group-hover:text-cyan" />
        </a>
        <a href={VSCODE_INSTALL} className={link}>
          Install in VS Code
          <ArrowUpRightIcon className="size-4 shrink-0 text-subtle transition-colors group-hover:text-cyan" />
        </a>
      </div>
      <CodeFrame
        title="Any MCP client, over stdio"
        copy={{ text: NPX, label: 'Copy the npx command' }}
      >
        <CodeBody code={`$ ${NPX}`} lang="sh" />
      </CodeFrame>
    </div>
  );
}

export function StarButton({ className = '' }: { className?: string }) {
  return (
    <a
      href={REPO}
      className={`inline-flex items-center gap-2 rounded-lg border border-line-strong bg-raised-2 px-3.5 py-2 text-sm font-medium text-fg transition-colors hover:border-cyan/60 hover:bg-raised-3 ${className}`}
    >
      <StarIcon className="size-4 text-cyan" />
      Star on GitHub
    </a>
  );
}
