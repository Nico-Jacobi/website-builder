import { type KeyboardEvent, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Sparkles, Loader2 } from 'lucide-react';
import { createSite } from '../../data/siteClient';
import './NewSitePage.css';

const SUGGESTIONS = [
    'A SaaS landing page for a project management tool targeting remote teams',
    'A portfolio site for a freelance UX designer with case studies',
    'A startup homepage for an AI-powered code review tool',
    'An e-commerce site for handmade candles with a cozy aesthetic',
];

export function NewSitePage() {
    const navigate = useNavigate();
    const [prompt, setPrompt]         = useState('');
    const [name, setName]             = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [error, setError]           = useState<string | null>(null);

    const canSubmit = prompt.trim().length > 0 && !submitting;

    async function handleSubmit() {
        if (!canSubmit) return;
        setSubmitting(true);
        setError(null);
        const siteName = name.trim() || prompt.trim().slice(0, 48);
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
        <div className="new_site_page">
            <Link to="/" className="new_site_page__back">
                <ArrowLeft size={15} />
                Back
            </Link>

            <div className="new_site_page__logo">
                <Sparkles size={16} />
                <span>OneP<span className="new_site_page__logo-ai">ai</span>ge</span>
            </div>

            <div className="new_site_page__card">
                <div className="new_site_page__card-header">
                    <h1 className="new_site_page__heading">What do you want to build?</h1>
                    <p className="new_site_page__sub">
                        Describe your site in plain language — product, audience, tone, pages.
                        The AI will handle the rest.
                    </p>
                </div>

                <textarea
                    className="new_site_page__textarea"
                    value={prompt}
                    onChange={e => setPrompt(e.target.value)}
                    onKeyDown={onKeyDown}
                    placeholder="e.g. A SaaS landing page for a project management tool targeting remote teams. Clean and modern, with a hero, features, pricing and FAQ."
                    rows={5}
                    autoFocus
                    disabled={submitting}
                />

                <div className="new_site_page__suggestions">
                    {SUGGESTIONS.map(s => (
                        <button key={s} className="new_site_page__suggestion" onClick={() => setPrompt(s)} disabled={submitting}>
                            {s}
                        </button>
                    ))}
                </div>

                <div className="new_site_page__name-row">
                    <label className="new_site_page__name-label" htmlFor="site-name">
                        Site name
                        <span className="new_site_page__optional">(optional)</span>
                    </label>
                    <input
                        id="site-name"
                        className="new_site_page__name-input"
                        value={name}
                        onChange={e => setName(e.target.value)}
                        placeholder="My startup"
                        disabled={submitting}
                    />
                </div>

                {error && <p className="new_site_page__error">{error}</p>}

                <button
                    className="new_site_page__submit"
                    onClick={() => void handleSubmit()}
                    disabled={!canSubmit}
                >
                    {submitting ? (
                        <>
                            <Loader2 size={16} className="new_site_page__spinner" />
                            Creating…
                        </>
                    ) : (
                        <>
                            Generate site
                            <ArrowRight size={16} />
                        </>
                    )}
                </button>
                <p className="new_site_page__hint">⌘ + Enter to submit</p>
            </div>
        </div>
    );
}
