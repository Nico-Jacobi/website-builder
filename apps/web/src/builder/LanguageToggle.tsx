import { useTranslation } from 'react-i18next';
import i18n from '../i18n';
import './LanguageToggle.css';

/**
 * Language toggle button — switches between DE and EN.
 * Displays the "other" language (click to switch to it).
 * Preference is persisted to localStorage via i18next's LanguageDetector.
 */
export function LanguageToggle() {
    const { i18n: currentI18n } = useTranslation();
    const currentLang = currentI18n.language;
    const isDE = currentLang.startsWith('de');

    const handleToggle = () => {
        const newLang = isDE ? 'en' : 'de';
        i18n.changeLanguage(newLang);
    };

    // Button shows the language you're switching TO
    const nextLang = isDE ? 'EN' : 'DE';
    const title = isDE ? 'Switch to English' : 'Zur deutschen Sprache wechseln';
    const ariaLabel = isDE ? 'Switch to English' : 'Switch to German';

    return (
        <button
            onClick={handleToggle}
            className="language-toggle"
            title={title}
            aria-label={ariaLabel}
        >
            {nextLang}
        </button>
    );
}
