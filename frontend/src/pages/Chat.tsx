// Chat page — fixture-scoped AI conversation
// Desktop: 3-column (sidebar | chat main | right context panel)
// Spec: match banner header, structured AI responses, prediction card inline

import { useEffect, useRef } from 'react';
import { useParams, useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useGameweek } from '../hooks/useGameweek';
import { useChat } from '../hooks/useChat';
import ChatInput from '../components/chat/ChatInput';
import MessageBubble from '../components/chat/MessageBubble';
import MatchContext from '../components/chat/MatchContext';

export default function Chat() {
  const { fixtureId: fixtureIdParam } = useParams<{ fixtureId?: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { currentGw, loading: gwLoading } = useGameweek();

  const fixtureId = fixtureIdParam ? parseInt(fixtureIdParam) : undefined;
  const gwParam = searchParams.get('gw');
  const activeGw = gwParam ? parseInt(gwParam) : currentGw;

  const { messages, loading, error, send } = useChat(activeGw, fixtureId);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = (message: string) => {
    send(message, fixtureId);
  };

  // ── Loading ──
  if (gwLoading || !activeGw) {
    return (
      <div className="chat-loading">
        <div className="spinner" />
        <style>{chatStyles}</style>
      </div>
    );
  }

  // ── No fixture — redirect to hub ──
  if (!fixtureId) {
    return (
      <div className="chat-no-fixture">
        <p>Pick a fixture from the <Link to="/">Hub</Link> to start a chat.</p>
        <style>{chatStyles}</style>
      </div>
    );
  }

  return (
    <div className="chat-page" id="chat-page">
      {/* ── Main chat column ── */}
      <div className="chat-main">
        {/* Match banner header */}
        <div className="chat-banner">
          <Link to="/" className="chat-back">←</Link>
          <div className="chat-banner-info">
            <span className="chat-banner-title">
              Match Chat
            </span>
            <span className="chat-banner-sub">GW{activeGw} · Premier League</span>
          </div>
          <Link to={`/?gw=${activeGw}`} className="chat-hub-link">Hub</Link>
        </div>

        {/* Messages */}
        <div className="chat-messages" id="chat-messages">
          {messages.length === 0 && (
            <div className="chat-empty">
              <div className="chat-empty-icon">⚽</div>
              <h3 className="chat-empty-title">Ready when you are</h3>
              <p className="chat-empty-hint">
                Ask the Gaffer about this match — form, injuries, predictions, the lot.
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
            <div className="chat-error">⚠️ {error}</div>
          )}

          <div ref={messagesEndRef} />
        </div>

        <ChatInput
          onSend={handleSend}
          disabled={loading}
          placeholder="Ask Gaff3r about this match..."
        />
      </div>

      {/* ── Right context panel (desktop only) ── */}
      <div className="chat-ctx-panel">
        <MatchContext
          fixtureId={fixtureId}
          gameweek={activeGw}
          onSelectFixture={f => navigate(`/chat/${f.id}?gw=${activeGw}`)}
        />
      </div>

      <style>{chatStyles}</style>
    </div>
  );
}

const chatStyles = `
  .chat-loading, .chat-no-fixture {
    display: flex;
    align-items: center;
    justify-content: center;
    min-height: 50vh;
    font-family: var(--font-body);
    font-size: 16px;
    gap: 8px;
    flex-direction: column;
  }

  /* ── Full-bleed layout ── */
  .chat-page {
    display: flex;
    height: 100vh;
  }
  @media (max-width: 1199px) {
    .chat-page {
      height: calc(100vh - 56px);
      margin-top: 0;
    }
  }
  @media (max-width: 767px) {
    .chat-page {
      height: calc(100vh - 60px);
    }
  }

  /* ── Main column ── */
  .chat-main {
    flex: 1;
    display: flex;
    flex-direction: column;
    min-width: 0;
    border-right: 1px solid var(--color-border);
  }

  /* ── Banner ── */
  .chat-banner {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 0 20px;
    height: 64px;
    border-bottom: 1px solid var(--color-border);
    background: var(--color-cream);
    flex-shrink: 0;
  }
  .chat-back {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 32px; height: 32px;
    border-radius: var(--radius-md);
    background: var(--color-beige);
    color: var(--color-char);
    text-decoration: none;
    font-size: 16px;
    flex-shrink: 0;
    transition: all var(--transition-fast);
  }
  .chat-back:hover { background: var(--color-beige-hover); color: var(--color-char); }
  .chat-banner-info { flex: 1; min-width: 0; }
  .chat-banner-title {
    display: block;
    font-family: var(--font-display);
    font-size: 16px;
    font-weight: 700;
    color: var(--color-char);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .chat-banner-sub {
    display: block;
    font-family: var(--font-display);
    font-size: 12px;
    color: var(--color-muted);
  }
  .chat-hub-link {
    font-family: var(--font-display);
    font-size: 12px;
    font-weight: 600;
    padding: 5px 12px;
    border-radius: var(--radius-pill);
    border: 1px solid var(--color-border);
    color: var(--color-char-light);
    text-decoration: none;
    white-space: nowrap;
    flex-shrink: 0;
    transition: all var(--transition-fast);
  }
  .chat-hub-link:hover {
    background: var(--color-beige);
    color: var(--color-char);
  }

  /* ── Messages ── */
  .chat-messages {
    flex: 1;
    overflow-y: auto;
    padding: 20px;
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
  .chat-empty-icon { font-size: 44px; margin-bottom: 8px; }
  .chat-empty-title {
    font-family: var(--font-display);
    font-size: 20px;
    font-weight: 700;
    color: var(--color-char);
    margin: 0;
  }
  .chat-empty-hint {
    font-family: 'EB Garamond', serif;
    font-size: 16px;
    color: var(--color-muted);
    max-width: 320px;
    margin: 0;
    line-height: 1.5;
  }
  .chat-typing {
    display: flex;
    align-items: center;
    gap: 8px;
    align-self: flex-start;
    margin-bottom: 12px;
  }
  .msg-avatar {
    width: 32px; height: 32px;
    border-radius: 50%;
    background: var(--color-orange-soft);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 15px;
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
    width: 8px; height: 8px;
    border-radius: 50%;
    background: var(--color-char-muted);
    animation: typing-bounce 1.4s infinite;
  }
  .typing-indicator span:nth-child(2) { animation-delay: 0.2s; }
  .typing-indicator span:nth-child(3) { animation-delay: 0.4s; }
  @keyframes typing-bounce {
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
    font-family: var(--font-display);
    margin-bottom: 12px;
  }

  /* ── Right context panel ── */
  .chat-ctx-panel {
    display: none;
    width: 300px;
    flex-shrink: 0;
  }
  @media (min-width: 1200px) {
    .chat-ctx-panel { display: flex; }
  }
`;
