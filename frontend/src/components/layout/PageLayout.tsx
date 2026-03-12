// Shared page layout wrapper with navigation
// Handles content area spacing for all 3 nav variants

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
        .layout-content {
          /* Mobile: bottom nav padding */
          padding: 16px;
          padding-bottom: 80px;
        }
        /* Tablet: top nav offset */
        @media (min-width: 768px) {
          .layout-content {
            padding: 72px 24px 24px;
          }
        }
        /* Desktop: sidebar offset */
        @media (min-width: 1200px) {
          .layout-content {
            margin-left: 220px;
            padding: 24px 32px;
            max-width: 1200px;
          }
        }
      `}</style>
        </div>
    );
}
