import './i18n';
import './App.css';
import { Suspense } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { LandingPage } from './pages/LandingPage';
import { BuilderPage } from './pages/BuilderPage';
import { SitePreview } from './pages/SitePreview';
import { EditorPage } from './pages/EditorPage';
import DotGridBackground from './DotGridBackground';

function App() {
    return (
        <>
            <DotGridBackground />
            <div className="app-content">
                <Suspense fallback={null}>
                    <BrowserRouter>
                        <Routes>
                            <Route path="/" element={<LandingPage />} />
                            <Route path="/admin" element={<BuilderPage />} />
                            <Route path="/site/:identifier/:pagePath?" element={<SitePreview />} />
                            <Route path="/editor/:identifier/:pagePath?" element={<EditorPage />} />
                        </Routes>
                    </BrowserRouter>
                </Suspense>
            </div>
        </>
    );
}

export default App;
