// Chat page — fixture-scoped AI conversation
// When /chat/:fixtureId — loads chat history filtered to that fixture
// When /chat (no fixture) — shows session picker: existing chats + all fixtures to start new

import { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useGameweek } from '../hooks/useGameweek';
import { useChat } from '../hooks/useChat';
import ChatInput from '../components/chat/ChatInput';
import MessageBubble from '../components/chat/MessageBubble';
import { getFixtures, type FixtureData } from '../services/api';

export default function Chat() {
  const { fixtureId: fixtureIdParam } = useParams<{ fixtureId?: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { currentGw, loading: gwLoading } = useGameweek();

  const fixtureId = fixtureIdParam ? parseInt(fixtureIdParam) : undefined;
  const gwParam = searchParams.get('gw');
  const activeGw = gwParam ? parseInt(gwParam) : currentGw;

  const { messages, loading, error, send, chattedFixtureIds } = useChat(activeGw, fixtureId);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // For the picker — all fixtures when no fixture selected
  const [allFixtures, setAllFixtures] = useState<FixtureData[]>([]);
  const [fixtureInfo, setFixtureInfo] = useState<FixtureData | null>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Load fixture list for the session picker (only when no fixture selected)
  useEffect(() => {
    if (!activeGw) return;
    getFixtures(activeGw).then(d => {
      setAllFixtures(d.fixtures);
      if (fixtureId) {
        setFixtureInfo(d.fixtures.find(f => f.id === fixtureId) ?? null);
      }
    }).catch(() => {});
  }, [activeGw, fixtureId]);

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

  // ── No fixture selected: show session picker ──
  if (!fixtureId) {
    const chatted = allFixtures.filter(f => chattedFixtureIds.has(f.id));
    const fresh = allFixtures.filter(f => !chattedFixtureIds.has(f.id));

    return (
      <div className="chat-picker" id="chat-picker">
        <h2 className="picker-title">💬 Chat Sessions</h2>
        <p className="picker-subtitle">GW{activeGw} — pick a fixture to continue or start a new chat</p>

        {chatted.length > 0 && (
          <section className="picker-section">
            <h3 className="picker-section-title">Continue a chat</h3>
            <div className="picker-list">
              {chatted.map(f => (
                <FixtureSessionCard
                  key={f.id}
                  fixture={f}
                  hasChat
                  onClick={() => navigate(`/chat/${f.id}?gw=${activeGw}`)}
                />
              ))}
            </div>
          </section>
        )}

        {fresh.length > 0 && (
          <section className="picker-section">
            <h3 className="picker-section-title">New chat</h3>
            <div className="picker-list">
              {fresh.map(f => (
                <FixtureSessionCard
                  key={f.id}
                  fixture={f}
                  hasChat={false}
                  onClick={() => navigate(`/chat/${f.id}?gw=${activeGw}`)}
                />
              ))}
            </div>
          </section>
        )}

        {allFixtures.length === 0 && (
          <div className="picker-empty">
            <div className="spinner" />
          </div>
        )}

        <style>{chatStyles}</style>
      </div>
    );
  }

  // ── Fixture selected: show conversation ──
  const kickoffStr = fixtureInfo
    ? new Date(fixtureInfo.kickoffTime).toLocaleDateString([], { weekday: 'short', day: 'numeric', month: 'short' })
    : null;

  return (
    <div className="chat-page" id="chat-page">
      <div className="chat-main">
        <div className="chat-header">
          <div className="chat-header-left">
            <Link to={`/chat?gw=${activeGw}`} className="chat-back-btn" title="All sessions">
              ←
            </Link>
            <div>
              <h2 className="chat-title">
                {fixtureInfo
                  ? `${fixtureInfo.homeTeam} vs ${fixtureInfo.awayTeam}`
                  : '⚽ The Gaffer'}
              </h2>
              {kickoffStr && (
                <span className="chat-subtitle">GW{activeGw} · {kickoffStr}</span>
              )}
            </div>
          </div>
          <Link to="/" className="chat-hub-btn">Hub</Link>
        </div>

        <div className="chat-messages" id="chat-messages">
          {messages.length === 0 && (
            <div className="chat-empty">
              <div className="chat-empty-icon">⚽</div>
              <h3 className="chat-empty-title">Ready for a chat, gaffer?</h3>
              <p className="chat-empty-hint">
                {fixtureInfo
                  ? `Ask me about ${fixtureInfo.homeTeam} vs ${fixtureInfo.awayTeam} — form, injuries, predictions, the lot.`
                  : 'Ask me about any match.'}
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
          placeholder={fixtureInfo
            ? `Ask about ${fixtureInfo.homeTeam} vs ${fixtureInfo.awayTeam}...`
            : 'Ask about any match...'}
        />
      </div>

      <style>{chatStyles}</style>
    </div>
  );
}

// ── Session picker card ──
function FixtureSessionCard({
  fixture,
  hasChat,
  onClick,
}: {
  fixture: FixtureData;
  hasChat: boolean;
  onClick: () => void;
}) {
  const kickoff = new Date(fixture.kickoffTime);
  const dateStr = kickoff.toLocaleDateString([], { weekday: 'short', day: 'numeric', month: 'short' });
  const timeStr = kickoff.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  return (
    <button className={`session-card ${hasChat ? 'session-card-active' : ''}`} onClick={onClick}>
      <div className="session-card-teams">
        <span className="session-team">{fixture.homeTeam}</span>
        <span className="session-vs">vs</span>
        <span className="session-team">{fixture.awayTeam}</span>
      </div>
      <div className="session-card-meta">
        <span className="session-date">{fixture.finished ? 'FT' : `${dateStr} · ${timeStr}`}</span>
        {hasChat && <span className="session-badge">💬 Resume</span>}
        {!hasChat && <span className="session-new">New →</span>}
      </div>
    </button>
  );
}

const chatStyles = `
  .chat-loading {
    display: flex;
    align-items: center;
    justify-content: center;
    min-height: 50vh;
  }

  /* ── Session picker ── */
  .chat-picker {
    max-width: 640px;
    margin: 0 auto;
    padding: 8px 0;
  }
  .picker-title {
    font-family: var(--font-display);
    font-size: 24px;
    font-weight: 800;
    margin-bottom: 4px;
  }
  .picker-subtitle {
    color: var(--color-char-muted);
    font-size: 15px;
    margin-bottom: 28px;
  }
  .picker-section {
    margin-bottom: 28px;
  }
  .picker-section-title {
    font-family: var(--font-display);
    font-size: 13px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.8px;
    color: var(--color-char-muted);
    margin-bottom: 10px;
  }
  .picker-list {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }
  .picker-empty {
    display: flex;
    justify-content: center;
    padding: 40px;
  }
  .session-card {
    display: flex;
    align-items: center;
    justify-content: space-between;
    width: 100%;
    padding: 14px 16px;
    background: var(--color-beige);
    border: 2px solid transparent;
    border-radius: var(--radius-lg);
    cursor: pointer;
    text-align: left;
    font-family: var(--font-body);
    transition: all var(--transition-fast);
    gap: 12px;
  }
  .session-card:hover {
    background: var(--color-beige-hover);
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(0,0,0,0.06);
  }
  .session-card-active {
    border-color: var(--color-orange);
    background: var(--color-orange-soft);
  }
  .session-card-teams {
    display: flex;
    align-items: center;
    gap: 8px;
    flex: 1;
    min-width: 0;
  }
  .session-team {
    font-family: var(--font-display);
    font-size: 15px;
    font-weight: 700;
    color: var(--color-char);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .session-vs {
    font-size: 12px;
    color: var(--color-char-muted);
    flex-shrink: 0;
  }
  .session-card-meta {
    display: flex;
    align-items: center;
    gap: 8px;
    flex-shrink: 0;
  }
  .session-date {
    font-size: 12px;
    color: var(--color-char-muted);
  }
  .session-badge {
    font-family: var(--font-display);
    font-size: 11px;
    font-weight: 600;
    color: var(--color-orange);
    background: var(--color-orange-soft);
    padding: 3px 10px;
    border-radius: var(--radius-pill);
  }
  .session-new {
    font-family: var(--font-display);
    font-size: 12px;
    font-weight: 600;
    color: var(--color-char-muted);
  }

  /* ── Fixture chat ── */
  .chat-page {
    display: flex;
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
  .chat-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 10px 14px;
    border-bottom: 1px solid var(--color-beige);
    gap: 10px;
  }
  .chat-header-left {
    display: flex;
    align-items: center;
    gap: 10px;
    min-width: 0;
  }
  .chat-back-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 32px;
    height: 32px;
    border-radius: var(--radius-md);
    background: var(--color-beige);
    color: var(--color-char-light);
    font-size: 16px;
    font-weight: 700;
    text-decoration: none;
    flex-shrink: 0;
    transition: all var(--transition-fast);
  }
  .chat-back-btn:hover {
    background: var(--color-beige-hover);
    color: var(--color-char);
  }
  .chat-title {
    font-family: var(--font-display);
    font-size: 16px;
    font-weight: 800;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  @media (min-width: 768px) {
    .chat-title { font-size: 18px; }
  }
  .chat-subtitle {
    display: block;
    font-size: 12px;
    color: var(--color-char-muted);
    font-family: var(--font-display);
  }
  .chat-hub-btn {
    font-family: var(--font-display);
    font-size: 12px;
    font-weight: 600;
    padding: 5px 12px;
    border-radius: var(--radius-pill);
    border: 1px solid var(--color-beige);
    color: var(--color-char-light);
    text-decoration: none;
    white-space: nowrap;
    transition: all var(--transition-fast);
    flex-shrink: 0;
  }
  .chat-hub-btn:hover {
    background: var(--color-beige);
    color: var(--color-char);
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
  .chat-empty-icon { font-size: 48px; margin-bottom: 8px; }
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
