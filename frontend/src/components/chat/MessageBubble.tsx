// Message bubble — renders user and assistant messages
// Assistant: parses structured sections (## Section\nContent) and renders them as named chips
// Falls back to plain paragraphs if no structured format detected

import type { ChatMessage } from '../../types';
import PredictionCard from './PredictionCard';

interface MessageBubbleProps {
    message: ChatMessage;
}

interface Section {
    header: string;
    body: string;
}

// Parse assistant response into named sections if structured
// Detects: "**Section Name**\nContent" or "## Section Name\nContent"
function parseSections(content: string): Section[] | null {
    // Try "**Header**\nBody" pattern (most common from AI)
    const boldPattern = /\*\*([^*]+)\*\*\n([\s\S]*?)(?=\*\*[^*]+\*\*|$)/g;
    const hashPattern = /^##\s+(.+)$/gm;

    // Count headers
    const boldMatches = [...content.matchAll(boldPattern)];
    const hashMatches = [...content.matchAll(hashPattern)];

    if (boldMatches.length >= 2) {
        return boldMatches.map(m => ({
            header: m[1].trim(),
            body: m[2].trim(),
        })).filter(s => s.body.length > 0);
    }

    if (hashMatches.length >= 2) {
        // Split by ## headers
        const parts = content.split(/^##\s+.+$/m).slice(1);
        return hashMatches.map((m, i) => ({
            header: m[1].trim(),
            body: (parts[i] ?? '').trim(),
        })).filter(s => s.body.length > 0);
    }

    return null; // no structured sections — render as plain text
}

export default function MessageBubble({ message }: MessageBubbleProps) {
    const isUser = message.role === 'user';
    const sections = !isUser ? parseSections(message.content) : null;

    return (
        <div className={`msg-wrap ${isUser ? 'msg-wrap--user' : 'msg-wrap--ai'}`}>
            {!isUser && <div className="msg-avatar">⚽</div>}

            <div className={`msg-bubble ${isUser ? 'msg-bubble--user' : 'msg-bubble--ai'}`}>
                {/* Structured sections */}
                {sections ? (
                    <div className="msg-sections">
                        {sections.map((s, i) => (
                            <div key={i} className="msg-section">
                                <span className="msg-section-hdr">{s.header}</span>
                                <p className="msg-section-body">{s.body}</p>
                            </div>
                        ))}
                    </div>
                ) : (
                    /* Plain text */
                    <div className="msg-content">
                        {message.content.split('\n').map((line, i) => (
                            <p key={i} className="msg-line">{line || '\u00A0'}</p>
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
        .msg-section-hdr {
          display: block;
          font-family: var(--font-display);
          font-size: 11px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.8px;
          color: var(--color-orange);
          margin-bottom: 4px;
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
      `}</style>
        </div>
    );
}
