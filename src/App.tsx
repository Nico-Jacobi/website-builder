import './App.css';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { BuilderPage } from './pages/BuilderPage';
import { SitePreview } from './pages/SitePreview';

function App() {
    return (
        <BrowserRouter>
            <Routes>
                <Route path="/" element={<BuilderPage />} />
                <Route path="/site" element={<SitePreview />} />
            </Routes>
        </BrowserRouter>
    );
}

export default App;
