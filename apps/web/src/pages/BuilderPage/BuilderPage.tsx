import { useState } from 'react';
import './BuilderPage.css';
import { SitesList } from './SitesList';
import { NewSiteDialog } from './NewSiteDialog';

export function BuilderPage() {
    const [dialogOpen, setDialogOpen] = useState(false);
    return (
        <div className="builder_page">
            <header className="builder_page__header">
                <h1 className="builder_page__title">Websites</h1>
                <button
                    className="builder_page__new"
                    onClick={() => setDialogOpen(true)}
                >
                    + Neue Site
                </button>
            </header>
            <SitesList />
            <NewSiteDialog isOpen={dialogOpen} onClose={() => setDialogOpen(false)} />
        </div>
    );
}
