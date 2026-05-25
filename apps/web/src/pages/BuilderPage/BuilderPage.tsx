import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Plus, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';
import './BuilderPage.css';
import { SitesList } from './SitesList';
import { NewSiteDialog } from './NewSiteDialog';
import { LanguageToggle } from '../../builder/LanguageToggle';

export function BuilderPage() {
    const { t } = useTranslation();
    const [dialogOpen, setDialogOpen] = useState(false);
    return (
        <div className="builder_page">
            <nav className="builder_page__topnav">
                <Link to="/" className="builder_page__brand">
                    <Sparkles size={16} />
                    <span>OneP<span className="builder_page__brand-ai">ai</span>ge</span>
                </Link>
                <LanguageToggle />
            </nav>
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
