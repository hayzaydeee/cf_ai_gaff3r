// Shared page layout wrapper
// Desktop: sidebar takes up 220px left; main content fills the rest
// Tablet: 56px top bar, content below
// Mobile: bottom tab bar, content above

import Navigation from './Navigation';

interface PageLayoutProps {
    children: React.ReactNode;
}

export default function PageLayout({ children }: PageLayoutProps) {
    return (
        <div className="layout-root">
            <Navigation />
            <main className="layout-content">
                {children}
            </main>

            <style>{`
        .layout-root {
          min-height: 100vh;
        }
        /* Mobile */
        .layout-content {
          padding: 16px;
          padding-bottom: 80px;
          min-height: 100vh;
        }
        /* Tablet: top nav offset */
        @media (min-width: 768px) {
          .layout-content {
            padding: 72px 24px 24px;
          }
        }
        /* Desktop: sidebar offset — no max-width so pages can fill */
        @media (min-width: 1200px) {
          .layout-content {
            margin-left: 220px;
            padding: 0;
            min-height: 100vh;
            display: flex;
            flex-direction: column;
          }
        }
      `}</style>
        </div>
    );
}
