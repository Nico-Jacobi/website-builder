import { useState, type KeyboardEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Sparkles, Layers, Zap, Globe, Palette, Code2, Loader2 } from 'lucide-react';
import { createSite } from '../../data/siteClient';
import './LandingPage.css';

const FEATURES = [
    {
        icon: Sparkles,
        title: 'AI-Powered Generation',
        body: 'Describe your vision in plain language. Our AI composes a complete, multi-page site spec in seconds.',
    },
    {
        icon: Layers,
        title: 'Component Library',
        body: 'Dozens of production-ready modules — Hero, Pricing, FAQ, Team, Timeline and more. All token-driven.',
    },
    {
        icon: Palette,
        title: 'Visual Inline Editing',
        body: 'Click any text or image on the live preview and edit it directly. No forms, no context switching.',
    },
    {
        icon: Zap,
        title: 'Instant Preview',
        body: 'Your site renders in real time as you configure it. What you see is exactly what ships.',
    },
    {
        icon: Globe,
        title: 'Theme System',
        body: 'A single JSON theme object controls every color, radius, and font across all modules at once.',
    },
    {
        icon: Code2,
        title: 'JSON Spec Export',
        body: 'Every site is a plain JSON object. Version it, diff it, or hand it to any renderer you own.',
    },
];

const SUGGESTIONS = [
    'SaaS landing page for a project management tool',
    'Portfolio site for a freelance UX designer',
    'Startup homepage for an AI-powered code review tool',
    'E-commerce site for handmade candles',
];

const STEPS = [
    { n: '01', title: 'Describe your site', body: 'Type a prompt — product, audience, tone. The AI plans a full site architecture.' },
    { n: '02', title: 'Review & refine', body: 'Swap modules, tweak copy, drag sections. Everything updates live in the preview pane.' },
    { n: '03', title: 'Publish', body: 'Export the JSON spec or publish directly. Your site is live in minutes, not days.' },
];

export function LandingPage() {
    const navigate = useNavigate();
    const [prompt, setPrompt]         = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [error, setError]           = useState<string | null>(null);

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
                    <button className="landing__btn landing__btn--ghost" onClick={() => navigate('/admin')}>
                        Dashboard
                    </button>
                </div>
            </nav>

            {/* ── Hero ── */}
            <section className="landing__hero">
                <div className="landing__hero-badge">
                    <Sparkles size={13} />
                    <span>AI-first website builder</span>
                </div>
                <h1 className="landing__hero-headline">
                    Build stunning sites<br />
                    <span className="landing__hero-gradient">with a single prompt</span>
                </h1>
                <p className="landing__hero-sub">
                    Describe your idea. AI assembles a complete, fully themed, multi-page site
                    using a library of production-ready modules — ready to edit and publish.
                </p>

                {/* ── Inline prompt box ── */}
                <div className="landing__prompt">
                    <div className="landing__prompt-suggestions">
                        {SUGGESTIONS.map(s => (
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
                        placeholder="e.g. A SaaS landing page for a project management tool targeting remote teams. Clean and modern, with hero, features, pricing and FAQ."
                        rows={3}
                        autoFocus
                        disabled={submitting}
                    />
                    <div className="landing__prompt-footer">
                        <span className="landing__prompt-hint">⌘ + Enter to submit</span>
                        {error && <span className="landing__prompt-error">{error}</span>}
                        <button
                            className="landing__btn landing__btn--primary"
                            onClick={() => void handleSubmit()}
                            disabled={!canSubmit}
                        >
                            {submitting ? (
                                <>
                                    <Loader2 size={15} className="landing__spinner" />
                                    Creating…
                                </>
                            ) : (
                                <>
                                    Generate site
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
                    <p className="landing__overline">Everything you need</p>
                    <h2 className="landing__section-heading">Built for speed, designed for quality</h2>
                    <p className="landing__section-sub">
                        OnePaige combines a powerful AI with a curated module library so your sites
                        look great from the first prompt.
                    </p>
                    <div className="landing__features-grid">
                        {FEATURES.map(({ icon: Icon, title, body }) => (
                            <div key={title} className="landing__feature-card">
                                <div className="landing__feature-icon">
                                    <Icon size={20} />
                                </div>
                                <h3 className="landing__feature-title">{title}</h3>
                                <p className="landing__feature-body">{body}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ── How it works ── */}
            <section className="landing__steps" id="how-it-works">
                <div className="landing__section-inner">
                    <p className="landing__overline">How it works</p>
                    <h2 className="landing__section-heading">From idea to live site in minutes</h2>
                    <div className="landing__steps-list">
                        {STEPS.map(({ n, title, body }) => (
                            <div key={n} className="landing__step">
                                <span className="landing__step-num">{n}</span>
                                <div>
                                    <h3 className="landing__step-title">{title}</h3>
                                    <p className="landing__step-body">{body}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ── CTA ── */}
            <section className="landing__cta">
                <div className="landing__cta-inner">
                    <h2 className="landing__cta-heading">Ready to build something?</h2>
                    <p className="landing__cta-sub">
                        Jump in and create your first site — it takes less than a minute.
                    </p>
                    <button
                        className="landing__btn landing__btn--primary landing__btn--lg"
                        onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                    >
                        Start building
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
                <p className="landing__footer-copy">© 2025 OnePaige. All rights reserved.</p>
            </footer>
        </div>
    );
}
