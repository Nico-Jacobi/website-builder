import { useState, type FormEvent } from 'react';
import './Newsletter.css';
import { useEditableText } from '../../../builder/useEditableText';
import type { NewsletterProps } from '@website-builder/shared';

export default function Newsletter({
    heading,
    body,
    submitUrl,
    placeholder,
    buttonLabel,
    successMessage,
    width,
}: NewsletterProps) {
    const headingEdit        = useEditableText('heading');
    const bodyEdit           = useEditableText('body');
    const buttonLabelEdit    = useEditableText('buttonLabel');
    const successMessageEdit = useEditableText('successMessage');

    const [email, setEmail] = useState('');
    const [submitted, setSubmitted] = useState(false);

    const sectionClasses = [
        'section',
        width === 'narrow' ? 'section--narrow' : '',
        'newsletter',
    ].filter(Boolean).join(' ');

    async function onSubmit(e: FormEvent) {
        e.preventDefault();
        if (submitUrl) {
            try {
                await fetch(submitUrl, {
                    method:  'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body:    JSON.stringify({ email }),
                });
            } catch {
                /* presentational module — swallow errors */
            }
        }
        setSubmitted(true);
    }

    return (
        <div className={sectionClasses}>
            <div className="newsletter__inner">
                <h2 className="newsletter__heading" {...headingEdit}>{heading}</h2>
                {body && <p className="newsletter__body" {...bodyEdit}>{body}</p>}
                {submitted ? (
                    <p className="newsletter__success" {...successMessageEdit}>{successMessage}</p>
                ) : (
                    <form className="newsletter__form" onSubmit={onSubmit}>
                        <input
                            className="newsletter__input"
                            type="email"
                            required
                            placeholder={placeholder}
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                        />
                        <button className="newsletter__button" type="submit" {...buttonLabelEdit}>
                            {buttonLabel}
                        </button>
                    </form>
                )}
            </div>
        </div>
    );
}
