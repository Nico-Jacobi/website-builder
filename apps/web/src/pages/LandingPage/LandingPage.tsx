import { useState, useMemo, type KeyboardEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowRight, Sparkles, Layers, MousePointerClick, MessageSquare, Globe, LayoutDashboard, Loader2 } from 'lucide-react';
import { createSite } from '../../data/siteClient';
import { LanguageToggle } from '../../builder/LanguageToggle';
import './LandingPage.css';

const FEATURE_ICONS = [Sparkles, Layers, MousePointerClick, MessageSquare, Globe, LayoutDashboard];
const FEATURE_KEYS = ['ai', 'components', 'editing', 'chat', 'hosting', 'admin'] as const;
const STEP_NUMS = ['01', '02', '03'] as const;
const STEP_KEYS = ['step1', 'step2', 'step3'] as const;
const SUGGESTION_KEYS = ['0', '1', '2', '3'] as const;

export function LandingPage() {
    const { t, i18n } = useTranslation();
    const navigate = useNavigate();
    const [prompt, setPrompt]         = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [error, setError]           = useState<string | null>(null);

    const visibleSuggestions = useMemo(() => {
        const all = SUGGESTION_KEYS.map(k => t(`landing.suggestions.${k}`));
        const shuffled = [...all].sort(() => Math.random() - 0.5);
        return shuffled.slice(0, 2);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [i18n.language]);

    const canSubmit = prompt.trim().length > 0 && !submitting;

    async function handleSubmit() {
        if (!canSubmit) return;
        setSubmitting(true);
        setError(null);
        const siteName = prompt.trim().slice(0, 48);
        try {
            const { identifier } = await createSite({ name: siteName, initialPrompt: prompt.trim() });
            navigate(`/editor/${encodeURIComponent(identifier)}`);
        } catch (e) {
            setError(e instanceof Error ? e.message : String(e));
            setSubmitting(false);
        }
    }

    function onKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
        if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
            e.preventDefault();
            void handleSubmit();
        }
    }

    return (
        <div className="landing">

            {/* ── Navbar ── */}
            <nav className="landing__nav">
                <div className="landing__nav-inner">
                    <span className="landing__logo">
                        <Sparkles size={18} />
                        <span>OneP<span className="landing__logo-ai">ai</span>ge</span>
                    </span>
                    <div className="landing__nav-actions">
                        <LanguageToggle />
                        <button className="landing__btn landing__btn--ghost" onClick={() => navigate('/admin')}>
                            {t('landing.nav.dashboardLabel')}
                        </button>
                    </div>
                </div>
            </nav>

            {/* ── Hero ── */}
            <section className="landing__hero">
                <div className="landing__hero-badge">
                    <Sparkles size={13} />
                    <span>{t('landing.hero.badge')}</span>
                </div>
                <h1 className="landing__hero-headline">
                    {t('landing.hero.headlineLine1')}<br />
                    <span className="landing__hero-gradient">{t('landing.hero.headlineLine2')}</span>
                </h1>
                <p className="landing__hero-sub">
                    {t('landing.hero.sub')}
                </p>

                {/* ── Inline prompt box ── */}
                <div className="landing__prompt">
                    <div className="landing__prompt-suggestions">
                        {visibleSuggestions.map(s => (
                            <button
                                key={s}
                                className="landing__prompt-chip"
                                onClick={() => setPrompt(s)}
                                disabled={submitting}
                            >
                                {s}
                            </button>
                        ))}
                    </div>
                    <textarea
                        className="landing__prompt-textarea"
                        value={prompt}
                        onChange={e => setPrompt(e.target.value)}
                        onKeyDown={onKeyDown}
                        placeholder={t('landing.prompt.placeholder')}
                        rows={3}
                        autoFocus
                        disabled={submitting}
                    />
                    <div className="landing__prompt-footer">
                        <span className="landing__prompt-hint">{t('landing.prompt.hint')}</span>
                        {error && <span className="landing__prompt-error">{error}</span>}
                        <button
                            className="landing__btn landing__btn--primary"
                            onClick={() => void handleSubmit()}
                            disabled={!canSubmit}
                        >
                            {submitting ? (
                                <>
                                    <Loader2 size={15} className="landing__spinner" />
                                    {t('landing.prompt.submitting')}
                                </>
                            ) : (
                                <>
                                    {t('landing.prompt.submit')}
                                    <ArrowRight size={15} />
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </section>

            {/* ── Features ── */}
            <section className="landing__features">
                <div className="landing__section-inner">
                    <p className="landing__overline">{t('landing.features.overline')}</p>
                    <h2 className="landing__section-heading">{t('landing.features.heading')}</h2>
                    <p className="landing__section-sub">{t('landing.features.sub')}</p>
                    <div className="landing__features-grid">
                        {FEATURE_KEYS.map((key, i) => {
                            const Icon = FEATURE_ICONS[i];
                            return (
                                <div key={key} className="landing__feature-card">
                                    <div className="landing__feature-icon">
                                        <Icon size={20} />
                                    </div>
                                    <h3 className="landing__feature-title">{t(`landing.features.${key}Title`)}</h3>
                                    <p className="landing__feature-body">{t(`landing.features.${key}Body`)}</p>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </section>

            {/* ── How it works ── */}
            <section className="landing__steps" id="how-it-works">
                <div className="landing__section-inner">
                    <p className="landing__overline">{t('landing.howItWorks.overline')}</p>
                    <h2 className="landing__section-heading">{t('landing.howItWorks.heading')}</h2>
                    <div className="landing__steps-list">
                        {STEP_KEYS.map((key, i) => (
                            <div key={key} className="landing__step">
                                <span className="landing__step-num">{STEP_NUMS[i]}</span>
                                <div>
                                    <h3 className="landing__step-title">{t(`landing.howItWorks.${key}Title`)}</h3>
                                    <p className="landing__step-body">{t(`landing.howItWorks.${key}Body`)}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ── CTA ── */}
            <section className="landing__cta">
                <div className="landing__cta-inner">
                    <h2 className="landing__cta-heading">{t('landing.cta.heading')}</h2>
                    <p className="landing__cta-sub">{t('landing.cta.sub')}</p>
                    <button
                        className="landing__btn landing__btn--primary landing__btn--lg"
                        onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                    >
                        {t('landing.cta.button')}
                        <ArrowRight size={18} />
                    </button>
                </div>
            </section>

            {/* ── Footer ── */}
            <footer className="landing__footer">
                <span className="landing__logo">
                    <Sparkles size={14} />
                    <span>OneP<span className="landing__logo-ai">ai</span>ge</span>
                </span>
                <p className="landing__footer-copy">{t('landing.footer.copy')}</p>
            </footer>
        </div>
    );
}
