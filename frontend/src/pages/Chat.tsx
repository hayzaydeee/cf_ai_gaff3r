// Chat page — AI conversation with match context sidebar

import { useEffect, useRef } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useGameweek } from '../hooks/useGameweek';
import { useChat } from '../hooks/useChat';
import ChatInput from '../components/chat/ChatInput';
import MessageBubble from '../components/chat/MessageBubble';
import MatchContext from '../components/chat/MatchContext';
import type { FixtureData } from '../services/api';

export default function Chat() {
  const { fixtureId: fixtureIdParam } = useParams<{ fixtureId?: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { currentGw, loading: gwLoading } = useGameweek();
  const fixtureId = fixtureIdParam ? parseInt(fixtureIdParam) : undefined;

  // Use GW from URL if present, otherwise fall back to current
  const gwParam = searchParams.get('gw');
  const activeGw = gwParam ? parseInt(gwParam) : currentGw;

  const { messages, loading, error, send } = useChat(activeGw);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSelectFixture = (fixture: FixtureData) => {
    navigate(`/chat/${fixture.id}?gw=${activeGw}`);
  };

  const handleSend = (message: string) => {
    send(message, fixtureId);
  };

  if (gwLoading || !activeGw) {
    return (
      <div className="chat-loading">
        <div className="spinner" />
        <style>{chatStyles}</style>
      </div>
    );
  }

  return (
    <div className="chat-page" id="chat-page">
      <div className="chat-main">
        <div className="chat-header">
          <h2 className="chat-title">⚽ The Gaffer</h2>
          {fixtureId && (
            <button
              className="chat-clear-btn"
              onClick={() => navigate('/chat')}
            >
              Clear fixture
            </button>
          )}
        </div>

        <div className="chat-messages" id="chat-messages">
          {messages.length === 0 && (
            <div className="chat-empty">
              <div className="chat-empty-icon">⚽</div>
              <h3 className="chat-empty-title">Ready for a chat, gaffer?</h3>
              <p className="chat-empty-hint">
                {fixtureId
                  ? 'Ask me about this fixture — form, injuries, predictions, the lot.'
                  : 'Pick a fixture from the sidebar or just ask me about any match.'}
              </p>
            </div>
          )}

          {messages.map(msg => (
            <MessageBubble key={msg.id} message={msg} />
          ))}

          {loading && (
            <div className="chat-typing">
              <div className="msg-avatar">⚽</div>
              <div className="typing-indicator">
                <span /><span /><span />
              </div>
            </div>
          )}

          {error && (
            <div className="chat-error">
              ⚠️ {error}
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        <ChatInput
          onSend={handleSend}
          disabled={loading}
          placeholder={fixtureId ? 'Ask about this match...' : 'Ask about any match...'}
        />
      </div>

      {/* Desktop sidebar */}
      <div className="chat-sidebar">
        <MatchContext
          fixtureId={fixtureId}
          gameweek={activeGw}
          onSelectFixture={handleSelectFixture}
        />
      </div>

      <style>{chatStyles}</style>
    </div>
  );
}

const chatStyles = `
  .chat-loading {
    display: flex;
    align-items: center;
    justify-content: center;
    min-height: 50vh;
  }
  .chat-page {
    display: flex;
    gap: 0;
    height: calc(100vh - 80px);
    margin: -16px;
  }
  @media (min-width: 768px) {
    .chat-page {
      height: calc(100vh - 56px);
      margin: -72px -24px -24px;
    }
  }
  @media (min-width: 1200px) {
    .chat-page {
      height: 100vh;
      margin: -24px -32px;
    }
  }
  .chat-main {
    flex: 1;
    display: flex;
    flex-direction: column;
    min-width: 0;
  }
  .chat-sidebar {
    display: none;
  }
  @media (min-width: 1200px) {
    .chat-sidebar {
      display: block;
      width: 300px;
      flex-shrink: 0;
      padding: 16px;
      border-left: 1px solid var(--color-beige);
      overflow-y: auto;
    }
  }
  .chat-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 12px 16px;
    border-bottom: 1px solid var(--color-beige);
  }
  .chat-title {
    font-family: var(--font-display);
    font-size: 20px;
    font-weight: 800;
  }
  .chat-clear-btn {
    padding: 4px 12px;
    border: 1px solid var(--color-beige);
    border-radius: var(--radius-pill);
    background: none;
    color: var(--color-char-light);
    font-family: var(--font-display);
    font-size: 12px;
    font-weight: 600;
    cursor: pointer;
    transition: all var(--transition-fast);
  }
  .chat-clear-btn:hover {
    background: var(--color-beige);
  }
  .chat-messages {
    flex: 1;
    overflow-y: auto;
    padding: 16px;
    display: flex;
    flex-direction: column;
  }
  .chat-empty {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    text-align: center;
    flex: 1;
    gap: 8px;
    padding: 40px 20px;
  }
  .chat-empty-icon {
    font-size: 48px;
    margin-bottom: 8px;
  }
  .chat-empty-title {
    font-family: var(--font-display);
    font-size: 22px;
    font-weight: 700;
    color: var(--color-char);
  }
  .chat-empty-hint {
    font-size: 16px;
    color: var(--color-char-muted);
    max-width: 320px;
  }
  .chat-typing {
    display: flex;
    align-items: center;
    gap: 8px;
    align-self: flex-start;
    margin-bottom: 12px;
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
  }
  .typing-indicator {
    display: flex;
    gap: 4px;
    padding: 12px 16px;
    background: var(--color-beige);
    border-radius: var(--radius-lg);
  }
  .typing-indicator span {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: var(--color-char-muted);
    animation: typing 1.4s infinite;
  }
  .typing-indicator span:nth-child(2) { animation-delay: 0.2s; }
  .typing-indicator span:nth-child(3) { animation-delay: 0.4s; }
  @keyframes typing {
    0%, 60%, 100% { opacity: 0.3; transform: scale(0.8); }
    30% { opacity: 1; transform: scale(1); }
  }
  .chat-error {
    align-self: center;
    padding: 8px 16px;
    background: var(--color-error-soft);
    color: var(--color-error);
    border-radius: var(--radius-md);
    font-size: 14px;
    margin-bottom: 12px;
  }
`;
