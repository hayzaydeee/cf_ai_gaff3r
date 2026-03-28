// Message bubble — renders user and assistant messages
// Assistant: parses structured sections (## Section\nContent) and renders them as named chips
// Falls back to plain paragraphs if no structured format detected

import type { ChatMessage } from '../../types';
import PredictionCard from './PredictionCard';
import AnalysisBubble from './AnalysisBubble';

interface MessageBubbleProps {
    message: ChatMessage;
    showModelBlock?: boolean;
}

interface Section {
    header: string;
    body: string;
}

const CANONICAL_SECTIONS: Record<string, string> = {
  'the gaffers call': "The Gaffer's Call",
  'the gaffer call': "The Gaffer's Call",
  'form check': 'Form Check',
  'key factor': 'Key Factor',
  prediction: 'Prediction',
};

function normalizeHeader(header: string): string {
  return header.toLowerCase().replace(/[^a-z\s]/g, '').replace(/\s+/g, ' ').trim();
}

function toDisplayHeader(header: string): string {
  return CANONICAL_SECTIONS[normalizeHeader(header)] ?? header.trim();
}

function stripMarkdownEmphasis(text: string): string {
  return text
    .replace(/\*\*(.+?)\*\*/g, '$1')
    .replace(/\*(.+?)\*/g, '$1')
    .trim();
}

function collectSections(content: string, pattern: RegExp): Section[] {
  const matches = [...content.matchAll(pattern)];
  if (matches.length < 2) return [];

  return matches.map((m, i) => {
    const header = (m[1] ?? '').trim().replace(/:+$/, '').trim();
    const inlineBody = (m[2] ?? '').trim();
    const start = (m.index ?? 0) + m[0].length;
    const end = i + 1 < matches.length ? (matches[i + 1].index ?? content.length) : content.length;
    const trailingBody = content.slice(start, end).trim();
    const body = [inlineBody, trailingBody].filter(Boolean).join(inlineBody && trailingBody ? '\n' : '');

    return {
      header,
      body: stripMarkdownEmphasis(body),
    };
  }).filter(s => s.body.length > 0);
}

// Parse assistant response into named sections if structured.
// Detects: "**Section Name**: Content", "**Section Name**\nContent", and "## Section Name" variants.
export function parseAssistantSections(content: string): Section[] | null {
  const boldHeaderPattern = /^\s*\*\*([^*]+)\*\*:?\s*(.*)$/gm;
  const hashHeaderPattern = /^\s*##\s+(.+?)\s*:?[ \t]*(.*)$/gm;

  const boldSections = collectSections(content, boldHeaderPattern);
  if (boldSections.length >= 2) return boldSections;

  const hashSections = collectSections(content, hashHeaderPattern);
  if (hashSections.length >= 2) return hashSections;

  return null;
}

export default function MessageBubble({ message, showModelBlock = true }: MessageBubbleProps) {
    const isUser = message.role === 'user';
    const isStreaming = message.streaming === true;
    const isEmpty = message.content.length === 0;
    const sections = !isUser && !isEmpty ? parseAssistantSections(message.content) : null;

    // Analysis layout: stream text directly into AnalysisBubble for fixture chats,
    // or render final card when simResult is present.
    if (!isUser && !isEmpty && (message.simResult || message.metadata?.fixtureId)) {
        return (
            <div className="msg-wrap msg-wrap--ai">
                <div className="msg-avatar">⚽</div>
                <div className="msg-bubble msg-bubble--ai msg-bubble--analysis">
                    <AnalysisBubble message={message} showModelBlock={showModelBlock} />
                    {!isStreaming && (
                        <span className="msg-time">
                            {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                    )}
                </div>
            </div>
        );
    }

    return (
        <div className={`msg-wrap ${isUser ? 'msg-wrap--user' : 'msg-wrap--ai'}`}>
            {!isUser && <div className="msg-avatar">⚽</div>}

            <div className={`msg-bubble ${isUser ? 'msg-bubble--user' : 'msg-bubble--ai'}`}>
                {/* Typing indicator when streaming with no content yet */}
                {isStreaming && isEmpty && (
                    <div className="msg-typing">
                        <span /><span /><span />
                    </div>
                )}

                {/* Structured sections */}
                {sections ? (
                    <div className="msg-sections">
                        {sections.map((s, i) => (
                            <div key={i} className="msg-section">
                            <span className="msg-section-chip">{toDisplayHeader(s.header)}</span>
                              <p className="msg-section-body">{stripMarkdownEmphasis(s.body)}</p>
                            </div>
                        ))}
                    </div>
                ) : (
                    /* Plain text */
                    <div className="msg-content">
                        {message.content.split('\n').map((line, i) => (
                            <p key={i} className="msg-line">{stripMarkdownEmphasis(line) || '\u00A0'}</p>
                        ))}
                    </div>
                )}

                {/* Prediction card */}
                {message.prediction && <PredictionCard prediction={message.prediction} />}

                <span className="msg-time">
                    {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
            </div>

            <style>{`
        .msg-wrap {
          display: flex;
          gap: 8px;
          max-width: 80%;
          margin-bottom: 14px;
          align-items: flex-start;
        }
        .msg-wrap--user {
          align-self: flex-end;
          flex-direction: row-reverse;
          max-width: 70%;
        }
        .msg-wrap--ai { align-self: flex-start; }

        .msg-avatar {
          width: 32px; height: 32px;
          border-radius: 50%;
          background: var(--color-orange-soft);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 15px;
          flex-shrink: 0;
          margin-top: 2px;
        }

        .msg-bubble {
          padding: 12px 16px;
          border-radius: var(--radius-lg);
          position: relative;
          max-width: 100%;
        }
        .msg-bubble--user {
          background: var(--color-orange);
          color: #FFFFFF;
          border-bottom-right-radius: 4px;
          font-family: 'EB Garamond', serif;
          font-size: 15px;
        }
        .msg-bubble--ai {
          background: var(--color-beige);
          color: var(--color-char);
          border-bottom-left-radius: 4px;
        }

        /* Structured sections */
        .msg-sections {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }
        .msg-section {}
        .msg-section-chip {
          display: inline-flex;
          align-items: center;
          font-family: var(--font-display);
          font-size: 12px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.8px;
          color: var(--color-orange);
          background: transparent;
          border: 1px solid var(--color-border);
          border-radius: var(--radius-pill);
          padding: 2px 10px;
          margin-bottom: 6px;
        }
        .msg-section-body {
          font-family: 'EB Garamond', serif;
          font-size: 15px;
          color: var(--color-char);
          margin: 0;
          line-height: 1.55;
        }

        /* Plain text */
        .msg-content {
          font-family: 'EB Garamond', serif;
          font-size: 15px;
          line-height: 1.55;
        }
        .msg-line { margin: 0 0 4px; }
        .msg-line:last-child { margin-bottom: 0; }

        .msg-time {
          display: block;
          font-family: var(--font-display);
          font-size: 10px;
          opacity: 0.55;
          margin-top: 6px;
          text-align: right;
        }

        /* Analysis layout — wider padding for card content */
        .msg-bubble--analysis {
          padding: 10px;
          max-width: 100%;
        }

        /* Typing indicator */
        .msg-typing {
          display: flex;
          gap: 4px;
          align-items: center;
          padding: 2px 0;
        }
        .msg-typing span {
          width: 7px;
          height: 7px;
          border-radius: 50%;
          background: var(--color-orange);
          opacity: 0.6;
          animation: msg-bounce 1.2s ease-in-out infinite;
        }
        .msg-typing span:nth-child(2) { animation-delay: 0.2s; }
        .msg-typing span:nth-child(3) { animation-delay: 0.4s; }
        @keyframes msg-bounce {
          0%, 80%, 100% { transform: translateY(0); opacity: 0.6; }
          40% { transform: translateY(-5px); opacity: 1; }
        }
      `}</style>
        </div>
    );
}
