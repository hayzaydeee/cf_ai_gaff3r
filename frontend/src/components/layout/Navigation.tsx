// Navigation — responsive
// Mobile: bottom tab bar | Tablet: top nav | Desktop: left sidebar (220px)
// Redesign: spec-accurate orange sidebar, solid active state, icon set

import { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { useTheme } from '../../hooks/useTheme';
import { useAuth } from '../../context/AuthContext';
import AuthModal from '../common/AuthModal';

// ── Lucide-style SVG icons ──

function DashboardIcon() {
    return (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="3" width="7" height="7" />
            <rect x="14" y="3" width="7" height="7" />
            <rect x="14" y="14" width="7" height="7" />
            <rect x="3" y="14" width="7" height="7" />
        </svg>
    );
}

function MessageIcon() {
    return (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        </svg>
    );
}

function ZapIcon() {
    return (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
        </svg>
    );
}

function TrendingUpIcon() {
    return (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
            <polyline points="17 6 23 6 23 12" />
        </svg>
    );
}

function BeakerIcon() {
    return (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 3h6M9 3v7l-5 9a1 1 0 0 0 .9 1.5h14.2A1 1 0 0 0 20 19l-5-9V3" />
        </svg>
    );
}

function SunIcon() {
    return (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="5" />
            <line x1="12" y1="1" x2="12" y2="3" />
            <line x1="12" y1="21" x2="12" y2="23" />
            <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
            <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
            <line x1="1" y1="12" x2="3" y2="12" />
            <line x1="21" y1="12" x2="23" y2="12" />
            <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
            <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
        </svg>
    );
}

function MoonIcon() {
    return (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
        </svg>
    );
}

const NAV_ITEMS = [
    { path: '/', label: 'Hub', icon: DashboardIcon, soon: false },
    { path: '/chat', label: 'Chat', icon: MessageIcon, soon: false },
    { path: '/predictions', label: 'Predictions', icon: ZapIcon, soon: false },
    { path: '/stats', label: 'Stats', icon: TrendingUpIcon, soon: false },
    { path: '/studio', label: 'Studio', icon: BeakerIcon, soon: true },
];

function UserIcon() {
    return (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
            <circle cx="12" cy="7" r="4" />
        </svg>
    );
}

export default function Navigation() {
    const { theme, toggleTheme } = useTheme();
    const { user, isAuthenticated, signOut } = useAuth();
    const [authModalOpen, setAuthModalOpen] = useState(false);

    return (
        <>
            {/* ── Mobile: Bottom tab bar ── */}
            <nav className="nav-mobile" id="mobile-nav">
                {NAV_ITEMS.map(item => (
                    <NavLink
                        key={item.path}
                        to={item.path}
                        end={item.path === '/'}
                        className={({ isActive }) => `nav-tab ${isActive ? 'nav-tab-active' : ''}`}
                    >
                        <item.icon />
                        <span className="nav-tab-label">{item.label}</span>
                        {item.soon && <span className="nav-soon-dot" />}
                    </NavLink>
                ))}
                <button
                    className={`nav-tab ${isAuthenticated ? 'nav-tab-active' : ''}`}
                    onClick={() => isAuthenticated ? signOut() : setAuthModalOpen(true)}
                    aria-label={isAuthenticated ? 'Sign out' : 'Sign in'}
                >
                    <UserIcon />
                    <span className="nav-tab-label">{isAuthenticated ? 'You' : 'Sign in'}</span>
                </button>
            </nav>

            {/* ── Tablet: Top nav bar ── */}
            <nav className="nav-tablet" id="tablet-nav">
                <div className="nav-tablet-brand">
                    <span className="nav-logo-text">Gaff3r</span>
                </div>
                <div className="nav-tablet-links">
                    {NAV_ITEMS.map(item => (
                        <NavLink
                            key={item.path}
                            to={item.path}
                            end={item.path === '/'}
                            className={({ isActive }) => `nav-link ${isActive ? 'nav-link-active' : ''}`}
                        >
                            <item.icon />
                            <span>{item.label}</span>
                            {item.soon && <span className="nav-soon-badge">Soon</span>}
                        </NavLink>
                    ))}
                </div>
                {isAuthenticated ? (
                    <button onClick={signOut} className="nav-user-btn" title={user?.email ?? ''}>
                        <UserIcon />
                        <span className="nav-user-email">{user?.email?.split('@')[0]}</span>
                    </button>
                ) : (
                    <button onClick={() => setAuthModalOpen(true)} className="nav-signin-btn">
                        Sign in
                    </button>
                )}
                <button onClick={toggleTheme} className="nav-theme-btn" aria-label="Toggle theme" id="theme-toggle">
                    {theme === 'light' ? <MoonIcon /> : <SunIcon />}
                </button>
            </nav>

            {/* ── Desktop: Left sidebar ── */}
            <nav className="nav-desktop" id="desktop-nav">
                {/* Logo area */}
                <div className="nav-logo-area">
                    <span className="nav-desktop-logo">gaff3r</span>
                </div>
                {/* Orange accent bar */}
                <div className="nav-accent-bar" />

                {/* Nav items */}
                <div className="nav-desktop-links">
                    {NAV_ITEMS.map(item => (
                        <NavLink
                            key={item.path}
                            to={item.path}
                            end={item.path === '/'}
                            className={({ isActive }) =>
                                `nav-sidebar-link ${isActive ? 'nav-sidebar-link-active' : ''}`
                            }
                        >
                            <item.icon />
                            <span>{item.label}</span>
                            {item.soon && <span className="nav-soon-badge nav-soon-badge--sidebar">Soon</span>}
                        </NavLink>
                    ))}
                </div>

                {/* Footer / auth + theme toggle */}
                <div className="nav-desktop-footer">
                    {isAuthenticated ? (
                        <button onClick={signOut} className="nav-theme-btn-full">
                            <UserIcon />
                            <span className="nav-user-name" title={user?.email ?? ''}>{user?.email?.split('@')[0]}</span>
                            <span className="nav-signout-hint">Sign out</span>
                        </button>
                    ) : (
                        <button onClick={() => setAuthModalOpen(true)} className="nav-theme-btn-full nav-signin-desktop">
                            <UserIcon />
                            <span>Sign in</span>
                        </button>
                    )}
                    <button onClick={toggleTheme} className="nav-theme-btn-full" id="desktop-theme-toggle">
                        {theme === 'light' ? <MoonIcon /> : <SunIcon />}
                    <span>{theme === 'light' ? 'Dark Mode' : 'Light Mode'}</span>
                    </button>
                </div>
            </nav>

            <style>{`
        /* ── Mobile: Bottom tab bar ── */
        .nav-mobile {
          display: flex;
          position: fixed;
          bottom: 0;
          left: 0;
          right: 0;
          z-index: 50;
          background: var(--color-cream);
          border-top: 1px solid var(--color-border);
          padding: 6px 0 env(safe-area-inset-bottom, 6px);
        }
        .nav-tab {
          flex: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 2px;
          padding: 8px 4px;
          position: relative;
          color: var(--color-char-muted);
          text-decoration: none;
          font-family: var(--font-display);
          font-size: 10px;
          font-weight: 600;
          transition: color var(--transition-fast);
        }
        .nav-tab-active { color: var(--color-orange); }
        .nav-tab-label { font-size: 10px; }

        /* ── Tablet: Top nav bar ── */
        .nav-tablet {
          display: none;
          position: fixed;
          top: 0; left: 0; right: 0;
          z-index: 50;
          background: var(--color-cream);
          border-bottom: 1px solid var(--color-border);
          padding: 0 24px;
          height: 56px;
          align-items: center;
          gap: 16px;
        }
        .nav-tablet-brand { display: flex; align-items: center; }
        .nav-logo-text {
          font-family: var(--font-display);
          font-weight: 700;
          font-size: 20px;
          color: var(--color-orange);
        }
        .nav-tablet-links {
          display: flex;
          align-items: center;
          gap: 2px;
          margin-left: auto;
          margin-right: 8px;
        }
        .nav-link {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 8px 12px;
          border-radius: var(--radius-md);
          color: var(--color-char-light);
          text-decoration: none;
          font-family: var(--font-display);
          font-size: 13px;
          font-weight: 600;
          transition: all var(--transition-fast);
        }
        .nav-link:hover { background: var(--color-beige); color: var(--color-char); }
        .nav-link-active {
          background: var(--color-orange);
          color: #FFFFFF;
        }
        .nav-link-active:hover {
          background: var(--color-orange-hover);
          color: #FFFFFF;
        }
        .nav-theme-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 36px; height: 36px;
          border: none;
          border-radius: var(--radius-md);
          background: var(--color-beige);
          color: var(--color-char-light);
          cursor: pointer;
          transition: all var(--transition-fast);
          flex-shrink: 0;
        }
        .nav-theme-btn:hover { background: var(--color-beige-hover); color: var(--color-char); }

        /* ── Desktop: Left sidebar ── */
        .nav-desktop {
          display: none;
          position: fixed;
          top: 0; left: 0; bottom: 0;
          z-index: 50;
          width: 220px;
          background: var(--color-beige);
          border-right: 1px solid var(--color-border);
          flex-direction: column;
        }

        /* Logo area */
        .nav-logo-area {
          display: flex;
          align-items: center;
          padding: 0 24px;
          height: 72px;
          flex-shrink: 0;
        }
        .nav-desktop-logo {
          font-family: var(--font-display);
          font-weight: 700;
          font-size: 22px;
          color: var(--color-orange);
        }

        /* Orange accent bar */
        .nav-accent-bar {
          width: 100%;
          height: 3px;
          background: var(--color-orange);
          flex-shrink: 0;
        }

        /* Nav links */
        .nav-desktop-links {
          display: flex;
          flex-direction: column;
          gap: 2px;
          flex: 1;
          padding: 12px 0;
          overflow-y: auto;
        }
        .nav-sidebar-link {
          display: flex;
          align-items: center;
          gap: 10px;
          height: 44px;
          padding: 0 20px;
          color: var(--color-char);
          text-decoration: none;
          font-family: var(--font-display);
          font-size: 14px;
          font-weight: 500;
          transition: all var(--transition-fast);
        }
        .nav-sidebar-link:hover {
          background: var(--color-beige-hover);
          color: var(--color-char);
        }
        .nav-sidebar-link-active {
          background: var(--color-orange);
          color: #FFFFFF;
          font-weight: 600;
        }
        .nav-sidebar-link-active:hover {
          background: var(--color-orange-hover);
          color: #FFFFFF;
        }

        /* Footer */
        .nav-desktop-footer {
          padding: 12px 0;
          border-top: 1px solid var(--color-border);
          flex-shrink: 0;
        }
        .nav-theme-btn-full {
          display: flex;
          align-items: center;
          gap: 10px;
          height: 44px;
          width: 100%;
          padding: 0 20px;
          border: none;
          background: none;
          color: var(--color-char);
          font-family: var(--font-display);
          font-size: 13px;
          font-weight: 500;
          cursor: pointer;
          transition: all var(--transition-fast);
        }
        .nav-theme-btn-full:hover { background: var(--color-beige-hover); }

        /* ── Responsive breakpoints ── */
        @media (min-width: 768px) {
          .nav-mobile { display: none; }
          .nav-tablet { display: flex; }
        }
        @media (min-width: 1200px) {
          .nav-tablet { display: none; }
          .nav-desktop { display: flex; }
        }

        /* ── Coming Soon badge ── */
        .nav-soon-badge {
          font-family: var(--font-display);
          font-size: 9px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          color: var(--color-orange);
          border: 1px solid var(--color-orange);
          border-radius: var(--radius-pill);
          padding: 1px 5px;
          margin-left: auto;
          opacity: 0.85;
        }
        .nav-soon-badge--sidebar {
          color: inherit;
          border-color: currentColor;
          opacity: 0.5;
        }
        .nav-sidebar-link-active .nav-soon-badge--sidebar {
          color: #fff;
          border-color: rgba(255,255,255,0.6);
          opacity: 0.8;
        }
        .nav-soon-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: var(--color-orange);
          position: absolute;
          top: 6px;
          right: 8px;
        }

        /* ── Auth controls ── */
        .nav-signin-btn {
          padding: 7px 14px;
          background: var(--color-orange);
          color: #fff;
          border: none;
          border-radius: var(--radius-md);
          font-family: var(--font-display);
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          transition: background var(--transition-fast);
          white-space: nowrap;
        }
        .nav-signin-btn:hover { background: var(--color-orange-hover); }
        .nav-user-btn {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 7px 10px;
          background: var(--color-beige);
          color: var(--color-char);
          border: none;
          border-radius: var(--radius-md);
          font-family: var(--font-display);
          font-size: 13px;
          font-weight: 500;
          cursor: pointer;
          transition: background var(--transition-fast);
          max-width: 120px;
        }
        .nav-user-btn:hover { background: var(--color-beige-hover); }
        .nav-user-email {
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        .nav-user-name {
          flex: 1;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          text-align: left;
        }
        .nav-signout-hint {
          font-size: 11px;
          color: var(--color-char-muted);
          white-space: nowrap;
        }
        .nav-signin-desktop { color: var(--color-orange); font-weight: 600; }
      `}</style>

            <AuthModal isOpen={authModalOpen} onClose={() => setAuthModalOpen(false)} />
        </>
    );
}
