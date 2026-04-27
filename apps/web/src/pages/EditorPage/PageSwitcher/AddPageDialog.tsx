import { useState, useRef, useEffect } from 'react';
import type { SitemapEntry } from '@website-builder/shared';
import { SITEMAP_PATH_REGEX } from '@website-builder/shared';
import { addPage } from '../../../data/siteClient';
import './AddPageDialog.css';

interface AddPageDialogProps {
    identifier: string;
    sitemap: SitemapEntry[];
    onClose: () => void;
}

export function AddPageDialog({ identifier, sitemap, onClose }: AddPageDialogProps) {
    const [path, setPath] = useState('/');
    const [title, setTitle] = useState('');
    const [intent, setIntent] = useState('');
    const [error, setError] = useState<string | undefined>();
    const [submitting, setSubmitting] = useState(false);
    const pathRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        pathRef.current?.focus();
    }, []);

    const validate = (): string | undefined => {
        if (!SITEMAP_PATH_REGEX.test(path)) {
            return 'Path must start with / and only contain lowercase letters, numbers, hyphens, and slashes (e.g. /about).';
        }
        if (sitemap.some(e => e.path === path)) {
            return `Path "${path}" already exists in the sitemap.`;
        }
        if (!title.trim()) {
            return 'Title is required.';
        }
        if (!intent.trim()) {
            return 'Intent is required.';
        }
        return undefined;
    };

    const handleSubmit = async () => {
        const validationError = validate();
        if (validationError) {
            setError(validationError);
            return;
        }

        setSubmitting(true);
        setError(undefined);
        try {
            await addPage(identifier, { path, title: title.trim(), intent: intent.trim() });
            onClose();
        } catch (err) {
            setError(String(err));
        } finally {
            setSubmitting(false);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Escape') onClose();
    };

    return (
        <div className="add-page-overlay" onClick={onClose} onKeyDown={handleKeyDown}>
            <div
                className="add-page-dialog"
                role="dialog"
                aria-modal="true"
                aria-label="Add Page"
                onClick={e => e.stopPropagation()}
            >
                <header className="add-page-dialog__header">
                    <h2 className="add-page-dialog__title">Add Page</h2>
                    <button
                        className="add-page-dialog__close"
                        aria-label="Close"
                        onClick={onClose}
                    >
                        ×
                    </button>
                </header>

                <div className="add-page-dialog__body">
                    <label className="add-page-dialog__field">
                        <span className="add-page-dialog__field-label">Path</span>
                        <input
                            ref={pathRef}
                            className="add-page-dialog__input"
                            type="text"
                            value={path}
                            onChange={e => setPath(e.target.value)}
                            placeholder="/about"
                            autoComplete="off"
                        />
                    </label>

                    <label className="add-page-dialog__field">
                        <span className="add-page-dialog__field-label">Title</span>
                        <input
                            className="add-page-dialog__input"
                            type="text"
                            value={title}
                            onChange={e => setTitle(e.target.value)}
                            placeholder="About Us"
                        />
                    </label>

                    <label className="add-page-dialog__field">
                        <span className="add-page-dialog__field-label">
                            Intent
                            <span className="add-page-dialog__field-hint">({intent.length}/200)</span>
                        </span>
                        <textarea
                            className="add-page-dialog__textarea"
                            value={intent}
                            onChange={e => setIntent(e.target.value)}
                            placeholder="Company history, team, mission…"
                            maxLength={200}
                            rows={3}
                        />
                    </label>

                    {error && <p className="add-page-dialog__error">{error}</p>}
                </div>

                <footer className="add-page-dialog__footer">
                    <button
                        className="add-page-dialog__btn add-page-dialog__btn--cancel"
                        onClick={onClose}
                        disabled={submitting}
                    >
                        Cancel
                    </button>
                    <button
                        className="add-page-dialog__btn add-page-dialog__btn--submit"
                        onClick={() => void handleSubmit()}
                        disabled={submitting}
                    >
                        {submitting ? 'Adding…' : 'Add Page'}
                    </button>
                </footer>
            </div>
        </div>
    );
}
