// Chat input component — text input + send button

import { useState, useRef, useEffect } from 'react';

interface ChatInputProps {
    onSend: (message: string) => void;
    disabled?: boolean;
    placeholder?: string;
}

export default function ChatInput({ onSend, disabled, placeholder }: ChatInputProps) {
    const [value, setValue] = useState('');
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    // Auto-resize textarea
    useEffect(() => {
        const el = textareaRef.current;
        if (el) {
            el.style.height = 'auto';
            el.style.height = Math.min(el.scrollHeight, 120) + 'px';
        }
    }, [value]);

    const handleSubmit = () => {
        if (!value.trim() || disabled) return;
        onSend(value);
        setValue('');
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSubmit();
        }
    };

    return (
        <div className="chat-input-container" id="chat-input">
            <textarea
                ref={textareaRef}
                className="chat-input-field"
                value={value}
                onChange={e => setValue(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={placeholder ?? 'Ask the Gaffer about any match...'}
                disabled={disabled}
                rows={1}
            />
            <button
                className="chat-send-btn"
                onClick={handleSubmit}
                disabled={disabled || !value.trim()}
                aria-label="Send message"
                id="send-btn"
            >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="22" y1="2" x2="11" y2="13" />
                    <polygon points="22 2 15 22 11 13 2 9 22 2" />
                </svg>
            </button>

            <style>{`
        .chat-input-container {
          display: flex;
          align-items: flex-end;
          gap: 8px;
          padding: 12px 16px;
          background: var(--color-cream);
          border-top: 1px solid var(--color-beige);
        }
        .chat-input-field {
          flex: 1;
          padding: 10px 14px;
          border: 2px solid var(--color-beige);
          border-radius: var(--radius-md);
          background: var(--color-beige);
          color: var(--color-char);
          font-family: var(--font-body);
          font-size: 16px;
          line-height: 1.4;
          resize: none;
          outline: none;
          transition: border-color var(--transition-fast);
        }
        .chat-input-field:focus {
          border-color: var(--color-orange);
          background: transparent;
        }
        .chat-input-field::placeholder {
          color: var(--color-char-muted);
        }
        .chat-send-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 42px;
          height: 42px;
          border: none;
          border-radius: var(--radius-md);
          background: var(--color-orange);
          color: white;
          cursor: pointer;
          flex-shrink: 0;
          transition: all var(--transition-fast);
        }
        .chat-send-btn:hover:not(:disabled) {
          background: var(--color-orange-hover);
          transform: scale(1.05);
        }
        .chat-send-btn:disabled {
          opacity: 0.4;
          cursor: not-allowed;
        }
      `}</style>
        </div>
    );
}
