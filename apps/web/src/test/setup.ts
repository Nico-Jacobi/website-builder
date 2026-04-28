import '@testing-library/jest-dom/vitest';
import i18n from '../i18n';
import { beforeAll } from 'vitest';

/**
 * Initialize i18next for tests with English locale.
 * Ensures consistent test strings regardless of browser language.
 * All tests use English (EN) strings.
 */
beforeAll(async () => {
    // Ensure i18next is initialized and set to English
    if (!i18n.isInitialized) {
        await i18n.init();
    }
    // Force English for all tests for consistency
    await i18n.changeLanguage('en');
});
