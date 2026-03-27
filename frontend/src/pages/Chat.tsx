// Chat page — fixture-scoped AI conversation
// Desktop: 3-column (sidebar | chat main | right context panel)
// Spec: match banner header, structured AI responses, prediction card inline

import { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useGameweek } from '../hooks/useGameweek';
import { useChat } from '../hooks/useChat';
import { getFixtures, type FixtureData } from '../services/api';
import ChatInput from '../components/chat/ChatInput';
import MessageBubble from '../components/chat/MessageBubble';
import MatchContext from '../components/chat/MatchContext';
import ClubLogo from '../components/common/ClubLogo';

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
  const [selectedFixture, setSelectedFixture] = useState<FixtureData | null>(null);
  const [allFixtures, setAllFixtures] = useState<FixtureData[]>([]);

  useEffect(() => {
    if (!activeGw) return;
    let cancelled = false;

    getFixtures(activeGw)
      .then(({ fixtures }) => {
        if (cancelled) return;
        setAllFixtures(fixtures);
        setSelectedFixture(fixtureId ? fixtures.find(f => f.id === fixtureId) ?? null : null);
      })
      .catch(() => {
        if (!cancelled) {
          setSelectedFixture(null);
          setAllFixtures([]);
        }
      });

    return () => { cancelled = true; };
  }, [fixtureId, activeGw]);

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

  // ── No fixture — session picker ──
  if (!fixtureId) {
    const chatted = allFixtures.filter(f => chattedFixtureIds.has(f.id));
    const fresh = allFixtures.filter(f => !chattedFixtureIds.has(f.id));

    return (
      <div className="chat-picker" id="chat-picker">
        <h2 className="picker-title">Chat Sessions</h2>
        <p className="picker-subtitle">GW{activeGw} - pick a fixture to continue or start a new chat</p>

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
            <h3 className="picker-section-title">Start new</h3>
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

  const kickoffText = selectedFixture
    ? new Date(selectedFixture.kickoffTime).toLocaleString([], { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
    : `GW${activeGw} · Premier League`;

  const bannerTitle = selectedFixture
    ? `${selectedFixture.homeTeam} vs ${selectedFixture.awayTeam}`
    : 'Match Chat';

  return (
    <div className="chat-page" id="chat-page">
      {/* ── Main chat column ── */}
      <div className="chat-main">
        {/* Match banner header */}
        <div className="chat-banner">
          <Link to="/" className="chat-back">←</Link>
          <div className="chat-banner-info">
            <span className="chat-banner-title">
              {bannerTitle}
            </span>
            <span className="chat-banner-sub">{kickoffText}</span>
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
        <ClubLogo
          teamName={fixture.homeTeam}
          size={20}
          className="session-logo"
          fallbackClassName="session-logo-fallback"
          refData={{
            fplTeamId: fixture.homeTeamId,
            fdTeamId: fixture.homeTeamId,
            fplShortName: fixture.homeTeamShortName,
            fdShortName: fixture.homeTeamShortName,
          }}
        />
        <span className="session-team">{fixture.homeTeam}</span>
        <span className="session-vs">vs</span>
        <ClubLogo
          teamName={fixture.awayTeam}
          size={20}
          className="session-logo"
          fallbackClassName="session-logo-fallback"
          refData={{
            fplTeamId: fixture.awayTeamId,
            fdTeamId: fixture.awayTeamId,
            fplShortName: fixture.awayTeamShortName,
            fdShortName: fixture.awayTeamShortName,
          }}
        />
        <span className="session-team">{fixture.awayTeam}</span>
      </div>
      <div className="session-card-meta">
        <span className="session-date">{fixture.finished ? 'FT' : `${dateStr} - ${timeStr}`}</span>
        {hasChat ? <span className="session-badge">Resume</span> : <span className="session-new">New</span>}
      </div>
    </button>
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

  .chat-picker {
    width: min(1120px, 100%);
    margin: 0 auto;
    padding: 16px 24px 24px;
  }
  .picker-title {
    font-family: var(--font-display);
    font-size: 24px;
    font-weight: 800;
    margin-bottom: 4px;
    color: var(--color-char);
  }
  .picker-subtitle {
    color: var(--color-muted);
    font-size: 15px;
    margin-bottom: 24px;
    font-family: 'EB Garamond', serif;
  }
  .picker-section {
    margin-bottom: 24px;
  }
  .picker-section-title {
    font-family: var(--font-display);
    font-size: 12px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.8px;
    color: var(--color-muted);
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
    padding: 16px 18px;
    background: var(--color-beige);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-lg);
    cursor: pointer;
    text-align: left;
    gap: 12px;
    transition: all var(--transition-fast);
  }
  .session-card:hover {
    background: var(--color-beige-hover);
    transform: translateY(-1px);
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
    font-family: 'EB Garamond', serif;
    font-size: 12px;
    color: var(--color-muted);
    font-style: italic;
  }
  .session-logo,
  .session-logo-fallback {
    border-radius: 50%;
    flex-shrink: 0;
  }
  .session-logo {
    background: transparent;
    border: none;
    padding: 0;
  }
  .session-logo-fallback {
    background: var(--color-orange);
    color: #FFFFFF;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    font-family: var(--font-display);
    font-size: 8px;
    font-weight: 700;
  }
  .session-card-meta {
    display: flex;
    align-items: center;
    gap: 10px;
    flex-shrink: 0;
  }

  @media (max-width: 767px) {
    .chat-picker {
      padding: 16px;
      width: 100%;
    }
  }
  .session-date {
    font-family: var(--font-display);
    font-size: 12px;
    color: var(--color-char-light);
  }
  .session-badge {
    font-family: var(--font-display);
    font-size: 11px;
    font-weight: 600;
    color: var(--color-orange);
    background: transparent;
    border: 1px solid var(--color-orange);
    padding: 3px 10px;
    border-radius: var(--radius-pill);
  }
  .session-new {
    font-family: var(--font-display);
    font-size: 11px;
    font-weight: 600;
    color: var(--color-muted);
  }

  /* ── Full-bleed layout ── */
  .chat-page {
    display: flex;
    height: 100vh;
    box-sizing: border-box;
    padding-top: 16px;
  }
  @media (max-width: 1199px) {
    .chat-page {
      height: calc(100vh - 56px);
      margin-top: 0;
      padding-top: 0;
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
    width: 320px;
    flex-shrink: 0;
  }
  @media (min-width: 1200px) {
    .chat-ctx-panel { display: flex; }
  }
`;
