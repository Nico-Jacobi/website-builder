import { useEffect, useState, type KeyboardEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { createSite } from '../../data/siteClient';

interface NewSiteDialogProps {
    isOpen: boolean;
    onClose: () => void;
}

export function NewSiteDialog({ isOpen, onClose }: NewSiteDialogProps) {
    const [name, setName] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const navigate = useNavigate();

    useEffect(() => {
        if (isOpen) {
            setName('');
            setSubmitting(false);
            setError(null);
        }
    }, [isOpen]);

    async function onSubmit() {
        if (!name.trim() || submitting) return;
        setSubmitting(true);
        setError(null);
        try {
            const { identifier } = await createSite({ name: name.trim() });
            navigate(`/editor/${encodeURIComponent(identifier)}`);
        } catch (e) {
            setError(e instanceof Error ? e.message : String(e));
            setSubmitting(false);
        }
    }

    function onKeyDown(e: KeyboardEvent<HTMLInputElement>) {
        if (e.key === 'Enter') {
            e.preventDefault();
            void onSubmit();
        } else if (e.key === 'Escape') {
            e.preventDefault();
            onClose();
        }
    }

    if (!isOpen) return null;
    return (
        <div className="new_site_dialog__backdrop" onClick={onClose}>
            <div className="new_site_dialog" onClick={(e) => e.stopPropagation()}>
                <h2>Neue Site</h2>
                <label className="new_site_dialog__label">
                    Name
                    <input
                        className="new_site_dialog__input"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        onKeyDown={onKeyDown}
                        autoFocus
                    />
                </label>
                {error && <p className="new_site_dialog__error">{error}</p>}
                <div className="new_site_dialog__actions">
                    <button onClick={onClose} disabled={submitting}>Abbrechen</button>
                    <button
                        onClick={() => void onSubmit()}
                        disabled={submitting || !name.trim()}
                    >
                        {submitting ? 'Erstelle…' : 'Erstellen'}
                    </button>
                </div>
            </div>
        </div>
    );
}
