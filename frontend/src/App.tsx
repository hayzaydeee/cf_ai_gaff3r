import { Routes, Route } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import PageLayout from './components/layout/PageLayout';
import MigrationPrompt from './components/common/MigrationPrompt';
import Hub from './pages/Hub';
import Chat from './pages/Chat';
import Predictions from './pages/Predictions';
import Stats from './pages/Stats';
import AuthPage from './pages/Auth';
import { useState, useEffect } from 'react';

const ANON_ID_KEY = 'gaff3r-user-id';

// Shows MigrationPrompt once after a user first signs in if anonymous data exists
function MigrationGate({ children }: { children: React.ReactNode }) {
    const { isAuthenticated, isLoading } = useAuth();
    const [showMigration, setShowMigration] = useState(false);

    useEffect(() => {
        if (!isLoading && isAuthenticated && localStorage.getItem(ANON_ID_KEY)) {
            setShowMigration(true);
        }
    }, [isAuthenticated, isLoading]);

    return (
        <>
            {children}
            {showMigration && (
                <MigrationPrompt onDone={() => setShowMigration(false)} />
            )}
        </>
    );
}

function App() {
    return (
        <AuthProvider>
            <MigrationGate>
                <PageLayout>
                    <Routes>
                        <Route path="/" element={<Hub />} />
                        <Route path="/chat" element={<Chat />} />
                        <Route path="/chat/:fixtureId" element={<Chat />} />
                        <Route path="/predictions" element={<Predictions />} />
                        <Route path="/stats" element={<Stats />} />
                        <Route path="/auth" element={<AuthPage />} />
                    </Routes>
                </PageLayout>
            </MigrationGate>
        </AuthProvider>
    );
}

export default App;
