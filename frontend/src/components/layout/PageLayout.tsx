// Shared page layout wrapper with navigation
// TODO: Phase 3 implementation

import Navigation from './Navigation';

interface PageLayoutProps {
    children: React.ReactNode;
}

export default function PageLayout({ children }: PageLayoutProps) {
    return (
        <div>
            <Navigation />
            <main>{children}</main>
        </div>
    );
}
