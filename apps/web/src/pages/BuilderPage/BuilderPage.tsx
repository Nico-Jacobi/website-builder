import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Plus } from 'lucide-react';
import './BuilderPage.css';
import { SitesList } from './SitesList';
import { NewSiteDialog } from './NewSiteDialog';

export function BuilderPage() {
    const { t } = useTranslation();
    const [dialogOpen, setDialogOpen] = useState(false);
    return (
        <div className="builder_page">
            <header className="builder_page__header">
                <div className="builder_page__hero">
                    <h1 className="builder_page__title">{t('builder.title')}</h1>
                    <p className="builder_page__subtitle">
                        {t('builder.subtitle')}
                    </p>
                </div>
                <button
                    className="builder_page__new"
                    onClick={() => setDialogOpen(true)}
                >
                    <Plus size={16} strokeWidth={2} aria-hidden="true" />
                    <span>{t('builder.newSiteLabel')}</span>
                </button>
            </header>
            <SitesList />
            <NewSiteDialog isOpen={dialogOpen} onClose={() => setDialogOpen(false)} />
        </div>
    );
}
