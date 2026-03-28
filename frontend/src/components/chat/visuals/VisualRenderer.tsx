// Approach 2 scaffold: renders a parsed VISUAL_JSON spec
//
// Usage (when Approach 2 is implemented):
//   const spec = parseVisualSpec(message.content);
//   if (spec) return <VisualRenderer spec={spec} />;
//
// Each component in spec.components is looked up in the registry
// and rendered with its data props. Unknown component types render
// a fallback placeholder so missing components don't crash the UI.

import { getVisual, type VisualSpec } from './registry';

interface VisualRendererProps {
  spec: VisualSpec;
}

function UnknownVisual({ type }: { type: string }) {
  return (
    <div className="vr-unknown">
      <span className="vr-unknown-label">Visual: {type}</span>
      <span className="vr-unknown-note">(component not yet registered)</span>
      <style>{`
        .vr-unknown {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 10px 14px;
          background: var(--color-beige);
          border: 1px dashed var(--color-border);
          border-radius: var(--radius-md);
          opacity: 0.6;
        }
        .vr-unknown-label {
          font-family: var(--font-display);
          font-size: 11px;
          font-weight: 700;
          text-transform: uppercase;
          color: var(--color-char);
        }
        .vr-unknown-note {
          font-family: var(--font-display);
          font-size: 10px;
          color: var(--color-char-muted);
        }
      `}</style>
    </div>
  );
}

export default function VisualRenderer({ spec }: VisualRendererProps) {
  return (
    <div className="vr-wrap">
      {spec.components.map((item, i) => {
        const entry = getVisual(item.type);
        if (!entry) return <UnknownVisual key={i} type={item.type} />;
        const Comp = entry.component;
        return <Comp key={i} {...item.data} />;
      })}
      <style>{`
        .vr-wrap {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }
      `}</style>
    </div>
  );
}

// ── Future Approach 2 system prompt additions (reference) ──
//
// When implementing Approach 2 fully, extend the Gaffer system prompt with:
//
// ── MODE: VISUAL ──
// Use when the response would benefit from a custom data visualisation.
// After your text analysis, emit a VISUAL_JSON block declaring which components to render:
//
// <<<VISUAL_JSON>>>
// {
//   "intent": "<brief description of what this visual shows>",
//   "components": [
//     { "type": "<registered component type>", "data": { ... } }
//   ]
// }
// <<<END_VISUAL_JSON>>>
//
// Available component types (register in registry.ts as built):
//   "heatmap"        — pass/shot/pressure heatmap for a team or player
//   "timeline"       — match event timeline (goals, cards, subs)
//   "radar"          — team attribute radar (attack, defence, form, etc.)
//   "comparison_bar" — side-by-side stat bars for two teams
//   "scatter"        — xG vs goals scatter for a player over N games
