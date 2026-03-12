// Responsive navigation component
// Mobile: bottom tab bar | Tablet: top nav | Desktop: left sidebar

import { NavLink } from 'react-router-dom';
import { useTheme } from '../../hooks/useTheme';

// SVG icons as inline components for zero dependencies
function HomeIcon() {
    return (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
            <polyline points="9 22 9 12 15 12 15 22" />
        </svg>
    );
}

function ChatIcon() {
    return (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        </svg>
    );
}

function PredictionsIcon() {
    return (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <polyline points="14 2 14 8 20 8" />
            <line x1="16" y1="13" x2="8" y2="13" />
            <line x1="16" y1="17" x2="8" y2="17" />
            <polyline points="10 9 9 9 8 9" />
        </svg>
    );
}

function StatsIcon() {
    return (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="20" x2="18" y2="10" />
            <line x1="12" y1="20" x2="12" y2="4" />
            <line x1="6" y1="20" x2="6" y2="14" />
        </svg>
    );
}

function SunIcon() {
    return (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
        </svg>
    );
}

const NAV_ITEMS = [
    { path: '/', label: 'Hub', icon: HomeIcon },
    { path: '/chat', label: 'Chat', icon: ChatIcon },
    { path: '/predictions', label: 'Picks', icon: PredictionsIcon },
    { path: '/stats', label: 'Stats', icon: StatsIcon },
];

export default function Navigation() {
    const { theme, toggleTheme } = useTheme();

    return (
        <>
            {/* Mobile: Bottom tab bar */}
            <nav className="nav-mobile" id="mobile-nav">
                {NAV_ITEMS.map(item => (
                    <NavLink
                        key={item.path}
                        to={item.path}
                        end={item.path === '/'}
                        className={({ isActive }) =>
                            `nav-tab ${isActive ? 'nav-tab-active' : ''}`
                        }
                    >
                        <item.icon />
                        <span className="nav-tab-label">{item.label}</span>
                    </NavLink>
                ))}
            </nav>

            {/* Tablet: Top nav bar */}
            <nav className="nav-tablet" id="tablet-nav">
                <div className="nav-tablet-brand">
                    <span className="nav-logo">⚽</span>
                    <span className="nav-title">Gaff3r</span>
                </div>
                <div className="nav-tablet-links">
                    {NAV_ITEMS.map(item => (
                        <NavLink
                            key={item.path}
                            to={item.path}
                            end={item.path === '/'}
                            className={({ isActive }) =>
                                `nav-link ${isActive ? 'nav-link-active' : ''}`
                            }
                        >
                            <item.icon />
                            <span>{item.label}</span>
                        </NavLink>
                    ))}
                </div>
                <button onClick={toggleTheme} className="nav-theme-btn" aria-label="Toggle theme" id="theme-toggle">
                    {theme === 'light' ? <MoonIcon /> : <SunIcon />}
                </button>
            </nav>

            {/* Desktop: Left sidebar */}
            <nav className="nav-desktop" id="desktop-nav">
                <div className="nav-desktop-brand">
                    <span className="nav-logo-lg">⚽</span>
                    <h1 className="nav-desktop-title">Gaff3r</h1>
                </div>
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
                        </NavLink>
                    ))}
                </div>
                <div className="nav-desktop-footer">
                    <button onClick={toggleTheme} className="nav-theme-btn-full" id="desktop-theme-toggle">
                        {theme === 'light' ? <MoonIcon /> : <SunIcon />}
                        <span>{theme === 'light' ? 'Dark mode' : 'Light mode'}</span>
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
          border-top: 1px solid var(--color-beige);
          padding: 6px 0 env(safe-area-inset-bottom, 6px);
        }
        .nav-tab {
          flex: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 2px;
          padding: 8px 4px;
          color: var(--color-char-muted);
          text-decoration: none;
          font-family: var(--font-display);
          font-size: 11px;
          font-weight: 500;
          transition: color var(--transition-fast);
        }
        .nav-tab-active {
          color: var(--color-orange);
        }
        .nav-tab-label {
          font-size: 11px;
        }

        /* ── Tablet: Top nav bar ── */
        .nav-tablet {
          display: none;
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          z-index: 50;
          background: var(--color-cream);
          border-bottom: 1px solid var(--color-beige);
          padding: 0 24px;
          height: 56px;
          align-items: center;
        }
        .nav-tablet-brand {
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .nav-logo { font-size: 24px; }
        .nav-title {
          font-family: var(--font-display);
          font-weight: 800;
          font-size: 22px;
          color: var(--color-char);
        }
        .nav-tablet-links {
          display: flex;
          align-items: center;
          gap: 4px;
          margin-left: auto;
          margin-right: 16px;
        }
        .nav-link {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 8px 14px;
          border-radius: var(--radius-md);
          color: var(--color-char-light);
          text-decoration: none;
          font-family: var(--font-display);
          font-size: 14px;
          font-weight: 600;
          transition: all var(--transition-fast);
        }
        .nav-link:hover {
          background: var(--color-beige);
          color: var(--color-char);
        }
        .nav-link-active {
          background: var(--color-orange-soft);
          color: var(--color-orange);
        }
        .nav-theme-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 40px;
          height: 40px;
          border: none;
          border-radius: var(--radius-md);
          background: var(--color-beige);
          color: var(--color-char-light);
          cursor: pointer;
          transition: all var(--transition-fast);
        }
        .nav-theme-btn:hover {
          background: var(--color-beige-hover);
          color: var(--color-char);
        }

        /* ── Desktop: Left sidebar ── */
        .nav-desktop {
          display: none;
          position: fixed;
          top: 0;
          left: 0;
          bottom: 0;
          z-index: 50;
          width: 220px;
          background: var(--color-cream);
          border-right: 1px solid var(--color-beige);
          padding: 24px 12px;
          flex-direction: column;
        }
        .nav-desktop-brand {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 0 8px 24px;
          border-bottom: 1px solid var(--color-beige);
          margin-bottom: 16px;
        }
        .nav-logo-lg { font-size: 32px; }
        .nav-desktop-title {
          font-family: var(--font-display);
          font-weight: 800;
          font-size: 26px;
          color: var(--color-char);
        }
        .nav-desktop-links {
          display: flex;
          flex-direction: column;
          gap: 4px;
          flex: 1;
        }
        .nav-sidebar-link {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 10px 12px;
          border-radius: var(--radius-md);
          color: var(--color-char-light);
          text-decoration: none;
          font-family: var(--font-display);
          font-size: 15px;
          font-weight: 600;
          transition: all var(--transition-fast);
        }
        .nav-sidebar-link:hover {
          background: var(--color-beige);
          color: var(--color-char);
        }
        .nav-sidebar-link-active {
          background: var(--color-orange-soft);
          color: var(--color-orange);
        }
        .nav-desktop-footer {
          padding-top: 16px;
          border-top: 1px solid var(--color-beige);
        }
        .nav-theme-btn-full {
          display: flex;
          align-items: center;
          gap: 10px;
          width: 100%;
          padding: 10px 12px;
          border: none;
          border-radius: var(--radius-md);
          background: var(--color-beige);
          color: var(--color-char-light);
          font-family: var(--font-display);
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
          transition: all var(--transition-fast);
        }
        .nav-theme-btn-full:hover {
          background: var(--color-beige-hover);
          color: var(--color-char);
        }

        /* ── Responsive breakpoints ── */
        @media (min-width: 768px) {
          .nav-mobile { display: none; }
          .nav-tablet { display: flex; }
        }
        @media (min-width: 1200px) {
          .nav-tablet { display: none; }
          .nav-desktop { display: flex; }
        }
      `}</style>
        </>
    );
}
