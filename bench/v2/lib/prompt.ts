// Every word the agent is given, in one place: the system prompt, which differs between arms
// only by the skill listing and the MCP server's instructions, and the task prompt, which is
// the same in every arm and ends with v1's instruction.

/** v1's suffix (bench/agents/run.mjs), unchanged, so v2's "none" arm asks for what v1's "base" did. */
export const TASK_SUFFIX =
  " Use this project's existing UI components and design tokens. Only create that file: do not modify other files, run commands or install packages.";

export function taskPrompt(prompt: string): string {
  return prompt + TASK_SUFFIX;
}

export interface Skill {
  name: string;
  description: string;
  /** The whole SKILL.md, frontmatter included, as the load_skill tool returns it. */
  body: string;
}

/** Name and description from a SKILL.md's YAML frontmatter (single-line values). */
export function parseSkill(text: string): Skill {
  const front = /^---\r?\n([\s\S]*?)\r?\n---/.exec(text);
  const field = (key: string) =>
    new RegExp(`^${key}:\\s*(.+)$`, 'm')
      .exec(front?.[1] ?? '')?.[1]
      ?.trim()
      .replace(/^["']|["']$/g, '') ?? '';
  const skill = { name: field('name'), description: field('description'), body: text };
  if (!skill.name || !skill.description)
    throw new Error('SKILL.md needs a name and a description in its frontmatter.');
  return skill;
}

export interface SystemPromptOptions {
  skill?: Skill | undefined;
  /** The MCP server's `instructions`, when its tools are offered. */
  mcpInstructions?: string | undefined;
}

export function systemPrompt(options: SystemPromptOptions = {}): string {
  const parts = [
    'You are a coding agent working in a software project. All paths are relative to the project root.',
    "You can list, read and search the project's files, and create or edit files, with the tools provided. You cannot run commands.",
    "Do the task in the user's message. When it is done, reply with one short sentence and stop calling tools.",
  ];
  if (options.skill) {
    parts.push(
      '',
      'Skills are instructions for particular kinds of work. Load one with the load_skill tool when its description matches the task, and follow it.',
      `- ${options.skill.name}: ${options.skill.description}`,
    );
  }
  if (options.mcpInstructions) {
    parts.push(
      '',
      'Instructions from the onsystem MCP server, whose tools are named mcp__onsystem__*:',
      options.mcpInstructions,
    );
  }
  return parts.join('\n');
}

export const LOAD_SKILL_TOOL = {
  name: 'load_skill',
  description: 'Load a skill by name. Returns its instructions.',
  schema: {
    type: 'object',
    properties: { name: { type: 'string', description: 'The skill name.' } },
    required: ['name'],
  },
};

/** Rough token count (characters / 4) for the planner's per-request overhead. */
export function roughTokens(text: string): number {
  return Math.ceil(text.length / 4);
}
