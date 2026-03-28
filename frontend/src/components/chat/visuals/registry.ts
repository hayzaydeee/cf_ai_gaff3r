// Approach 2 scaffold: VISUAL_JSON component registry
//
// In Approach 2, the LLM can declare arbitrary visual components inline:
//   <<<VISUAL_JSON>>>
//   {
//     "intent": "scorer_analysis",
//     "components": [
//       { "type": "heatmap", "data": { ... } },
//       { "type": "timeline", "data": { ... } }
//     ]
//   }
//   <<<END_VISUAL_JSON>>>
//
// This registry maps component type strings to lazy-loaded React components.
// Add new component types here as they're built.

import type { ComponentType } from 'react';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type VisualComponentProps = Record<string, any>;

export interface VisualSpec {
  intent: string;
  components: { type: string; data: VisualComponentProps }[];
}

/**
 * Registry entry: the component and optional display metadata.
 */
export interface RegistryEntry {
  component: ComponentType<VisualComponentProps>;
  displayName: string;
}

// ── Registered components ──
// Import and add components here as they're implemented.
// Currently scaffolded — no components registered yet (Approach 2 is V2).

const registry = new Map<string, RegistryEntry>();

/**
 * Register a visual component type.
 * Call this at app initialisation or in the component file itself.
 */
export function registerVisual(type: string, entry: RegistryEntry): void {
  registry.set(type, entry);
}

/**
 * Retrieve a registered component by type string.
 * Returns undefined if the type is not yet registered.
 */
export function getVisual(type: string): RegistryEntry | undefined {
  return registry.get(type);
}

/**
 * Parse a VISUAL_JSON block from an AI response string.
 * Returns null if no valid block is present.
 */
export function parseVisualSpec(response: string): VisualSpec | null {
  const match = response.match(/<<<VISUAL_JSON>>>([\s\S]*?)<<<END_VISUAL_JSON>>>/);
  if (!match) return null;

  try {
    const parsed = JSON.parse(match[1].trim()) as VisualSpec;
    if (!parsed.intent || !Array.isArray(parsed.components)) return null;
    return parsed;
  } catch {
    return null;
  }
}

/**
 * Strip the VISUAL_JSON block from response text (for display).
 */
export function stripVisualBlock(content: string): string {
  return content
    .replace(/<<<VISUAL_JSON>>>[\s\S]*?<<<END_VISUAL_JSON>>>/g, '')
    .trim();
}
