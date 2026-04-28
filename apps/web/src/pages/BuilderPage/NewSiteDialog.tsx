import { useEffect, useState, type KeyboardEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { createSite } from '../../data/siteClient';

interface NewSiteDialogProps {
    isOpen: boolean;
    onClose: () => void;
}

export function NewSiteDialog({ isOpen, onClose }: NewSiteDialogProps) {
    const { t } = useTranslation();
    const [name,        setName]        = useState('');
    const [description, setDescription] = useState('');
    const [submitting,  setSubmitting]  = useState(false);
    const [error,       setError]       = useState<string | null>(null);
    const navigate = useNavigate();

    useEffect(() => {
        if (isOpen) {
            setName('');
            setDescription('');
            setSubmitting(false);
            setError(null);
        }
    }, [isOpen]);

    async function onSubmit() {
        const trimmedName        = name.trim();
        const trimmedDescription = description.trim();
        if (!trimmedName || !trimmedDescription || submitting) return;
        setSubmitting(true);
        setError(null);
        try {
            const { identifier } = await createSite({
                name:          trimmedName,
                initialPrompt: trimmedDescription,
            });
            navigate(`/editor/${encodeURIComponent(identifier)}`);
        } catch (e) {
            setError(e instanceof Error ? e.message : String(e));
            setSubmitting(false);
        }
    }

    function onNameKeyDown(e: KeyboardEvent<HTMLInputElement>) {
        if (e.key === 'Escape') {
            e.preventDefault();
            onClose();
        }
    }

    if (!isOpen) return null;
    return (
        <div className="new_site_dialog__backdrop" onClick={onClose}>
            <div className="new_site_dialog" onClick={(e) => e.stopPropagation()}>
                <h2>{t('builder.newSiteDialog.title')}</h2>
                <label className="new_site_dialog__label">
                    {t('builder.newSiteDialog.nameLabel')}
                    <input
                        className="new_site_dialog__input"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        onKeyDown={onNameKeyDown}
                        autoFocus
                    />
                </label>
                <label className="new_site_dialog__label">
                    {t('builder.newSiteDialog.descriptionLabel')}
                    <textarea
                        className="new_site_dialog__textarea"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        rows={5}
                        placeholder={t('builder.newSiteDialog.descriptionPlaceholder')}
                    />
                </label>
                {error && <p className="new_site_dialog__error">{error}</p>}
                <div className="new_site_dialog__actions">
                    <button onClick={onClose} disabled={submitting}>{t('common.cancelLabel')}</button>
                    <button
                        onClick={() => void onSubmit()}
                        disabled={submitting || !name.trim() || !description.trim()}
                    >
                        {submitting ? t('builder.newSiteDialog.submitting') : t('builder.newSiteDialog.submit')}
                    </button>
                </div>
            </div>
        </div>
    );
}
