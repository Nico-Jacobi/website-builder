import { useState } from 'react';
import { Plus } from 'lucide-react';
import './BuilderPage.css';
import { SitesList } from './SitesList';
import { NewSiteDialog } from './NewSiteDialog';

export function BuilderPage() {
    const [dialogOpen, setDialogOpen] = useState(false);
    return (
        <div className="builder_page">
            <header className="builder_page__header">
                <div className="builder_page__hero">
                    <h1 className="builder_page__title">Deine Websites</h1>
                    <p className="builder_page__subtitle">
                        Erstelle, bearbeite und veröffentliche Sites im Chat.
                    </p>
                </div>
                <button
                    className="builder_page__new"
                    onClick={() => setDialogOpen(true)}
                >
                    <Plus size={16} strokeWidth={2} aria-hidden="true" />
                    <span>Neue Site</span>
                </button>
            </header>
            <SitesList />
            <NewSiteDialog isOpen={dialogOpen} onClose={() => setDialogOpen(false)} />
        </div>
    );
}
