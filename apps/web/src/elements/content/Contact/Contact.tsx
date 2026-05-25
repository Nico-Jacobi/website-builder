import { useState, type FormEvent } from 'react';
import './Contact.css';
import { useEditableText } from '../../../builder/useEditableText';
import type { ContactProps } from '@website-builder/shared';

export default function Contact({
    heading,
    body,
    nameLabel,
    emailLabel,
    messageLabel,
    buttonLabel,
    successMessage,
    submitUrl,
}: ContactProps) {
    const headingEdit        = useEditableText('heading');
    const bodyEdit           = useEditableText('body');
    const buttonLabelEdit    = useEditableText('buttonLabel');
    const successMessageEdit = useEditableText('successMessage');

    const [name, setName]       = useState('');
    const [email, setEmail]     = useState('');
    const [message, setMessage] = useState('');
    const [submitted, setSubmitted] = useState(false);
    const [error, setError]     = useState<string | null>(null);

    async function onSubmit(e: FormEvent) {
        e.preventDefault();
        setError(null);
        if (submitUrl) {
            try {
                const res = await fetch(submitUrl, {
                    method:  'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body:    JSON.stringify({ name, email, message }),
                });
                if (!res.ok) {
                    setError('Something went wrong. Please try again.');
                    return;
                }
            } catch {
                setError('Could not send your message. Please try again later.');
                return;
            }
        }
        setSubmitted(true);
    }

    return (
        <div className="section contact">
            <div className="contact__inner">
                <div className="contact__copy">
                    <h2 className="contact__heading" {...headingEdit}>{heading}</h2>
                    {body && <p className="contact__body" {...bodyEdit}>{body}</p>}
                </div>
                <div className="contact__form-wrap">
                    {submitted ? (
                        <p className="contact__success" {...successMessageEdit}>{successMessage}</p>
                    ) : (
                        <form className="contact__form" onSubmit={onSubmit} noValidate>
                            <div className="contact__field">
                                <label className="contact__label">{nameLabel}</label>
                                <input
                                    className="contact__input"
                                    type="text"
                                    required
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                />
                            </div>
                            <div className="contact__field">
                                <label className="contact__label">{emailLabel}</label>
                                <input
                                    className="contact__input"
                                    type="email"
                                    required
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                />
                            </div>
                            <div className="contact__field">
                                <label className="contact__label">{messageLabel}</label>
                                <textarea
                                    className="contact__textarea"
                                    required
                                    rows={5}
                                    value={message}
                                    onChange={(e) => setMessage(e.target.value)}
                                />
                            </div>
                            {error && <p className="contact__error">{error}</p>}
                            <button className="contact__button" type="submit" {...buttonLabelEdit}>
                                {buttonLabel}
                            </button>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
}
