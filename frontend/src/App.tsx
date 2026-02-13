import { Routes, Route } from 'react-router-dom';
import PageLayout from './components/layout/PageLayout';
import Hub from './pages/Hub';
import Chat from './pages/Chat';
import Predictions from './pages/Predictions';
import Stats from './pages/Stats';

function App() {
    return (
        <PageLayout>
            <Routes>
                <Route path="/" element={<Hub />} />
                <Route path="/chat" element={<Chat />} />
                <Route path="/chat/:fixtureId" element={<Chat />} />
                <Route path="/predictions" element={<Predictions />} />
                <Route path="/stats" element={<Stats />} />
            </Routes>
        </PageLayout>
    );
}

export default App;
