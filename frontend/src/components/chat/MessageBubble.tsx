// Message bubble component — styled differently for user vs assistant

import type { ChatMessage } from '../../types';
import PredictionCard from './PredictionCard';

interface MessageBubbleProps {
    message: ChatMessage;
}

export default function MessageBubble({ message }: MessageBubbleProps) {
    const isUser = message.role === 'user';

    return (
        <div className={`msg-wrapper ${isUser ? 'msg-user' : 'msg-assistant'}`}>
            {!isUser && (
                <div className="msg-avatar">⚽</div>
            )}
            <div className={`msg-bubble ${isUser ? 'msg-bubble-user' : 'msg-bubble-assistant'}`}>
                <div className="msg-content">
                    {message.content.split('\n').map((line, i) => (
                        <p key={i} className="msg-line">{line || '\u00A0'}</p>
                    ))}
                </div>
                {message.prediction && (
                    <PredictionCard prediction={message.prediction} />
                )}
                <span className="msg-time">
                    {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
            </div>

            <style>{`
        .msg-wrapper {
          display: flex;
          gap: 8px;
          max-width: 85%;
          margin-bottom: 12px;
        }
        .msg-user {
          align-self: flex-end;
          flex-direction: row-reverse;
        }
        .msg-assistant {
          align-self: flex-start;
        }
        .msg-avatar {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          background: var(--color-orange-soft);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 16px;
          flex-shrink: 0;
          margin-top: 4px;
        }
        .msg-bubble {
          padding: 10px 14px;
          border-radius: var(--radius-lg);
          position: relative;
        }
        .msg-bubble-user {
          background: var(--color-orange);
          color: white;
          border-bottom-right-radius: 4px;
        }
        .msg-bubble-assistant {
          background: var(--color-beige);
          color: var(--color-char);
          border-bottom-left-radius: 4px;
        }
        .msg-content {
          font-size: 16px;
          line-height: 1.5;
        }
        .msg-line {
          margin: 0 0 4px;
        }
        .msg-line:last-child {
          margin-bottom: 0;
        }
        .msg-time {
          display: block;
          font-size: 11px;
          opacity: 0.6;
          margin-top: 4px;
          text-align: right;
          font-family: var(--font-display);
        }
      `}</style>
        </div>
    );
}
