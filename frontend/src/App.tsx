import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import PageLayout from './components/layout/PageLayout';
import Landing from './pages/Landing';
import Hub from './pages/Hub';
import Chat from './pages/Chat';
import Predictions from './pages/Predictions';
import Stats from './pages/Stats';
import Studio from './pages/Studio';
import AuthPage from './pages/Auth';

function RequireAuth({ children }: { children: React.ReactNode }) {
    const { isAuthenticated, isLoading } = useAuth();
    if (isLoading) return null;
    if (!isAuthenticated) return <Navigate to="/" replace />;
    return <>{children}</>;
}

function App() {
    return (
        <AuthProvider>
            <Routes>
                {/* Public landing — no app shell */}
                <Route path="/" element={<Landing />} />

                {/* Protected app shell — redirects unauthenticated users to landing */}
                <Route path="/*" element={
                    <RequireAuth>
                        <PageLayout>
                            <Routes>
                                <Route path="/hub" element={<Hub />} />
                                <Route path="/chat" element={<Chat />} />
                                <Route path="/chat/:fixtureId" element={<Chat />} />
                                <Route path="/predictions" element={<Predictions />} />
                                <Route path="/stats" element={<Stats />} />
                                <Route path="/studio" element={<Studio />} />
                                <Route path="/auth" element={<AuthPage />} />
                            </Routes>
                        </PageLayout>
                    </RequireAuth>
                } />
            </Routes>
        </AuthProvider>
    );
}

export default App;
