import { useState } from 'react';
import { Link } from 'react-router-dom';
import './SitePreview.css';
import Renderer from '../../builder/Renderer';
import { loadState } from '../../state/specStore';

export function SitePreview() {
    const [spec] = useState(() => loadState().spec);

    if (!spec) {
        return (
            <div className="site_preview__empty">
                <p>Noch keine Website generiert.</p>
                <Link to="/" className="site_preview__back-link">
                    ← Zurück zum Prompt
                </Link>
            </div>
        );
    }

    return (
        <>
            <Link to="/" className="site_preview__back-overlay">
                ← Zurück
            </Link>
            <Renderer spec={spec} />
        </>
    );
}
