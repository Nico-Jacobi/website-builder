import './i18n';
import './App.css';
import { Suspense } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { BuilderPage } from './pages/BuilderPage';
import { SitePreview } from './pages/SitePreview';
import { EditorPage } from './pages/EditorPage';

function App() {
    return (
        <Suspense fallback={null}>
            <BrowserRouter>
                <Routes>
                    <Route path="/" element={<BuilderPage />} />
                    <Route path="/site/:identifier/:pagePath?" element={<SitePreview />} />
                    <Route path="/editor/:identifier/:pagePath?" element={<EditorPage />} />
                </Routes>
            </BrowserRouter>
        </Suspense>
    );
}

export default App;
