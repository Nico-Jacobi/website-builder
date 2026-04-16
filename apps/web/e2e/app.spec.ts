import { test, expect } from '@playwright/test';

test.describe('App E2E', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('/');
    });

    // ── Page Load & Structure ───────────────────────────────────────────

    test('page loads successfully', async ({ page }) => {
        await expect(
            page.getByRole('heading', { name: 'My Website' }),
        ).toBeVisible();
    });

    test('all sections render in correct order', async ({ page }) => {
        // Verify every key section is present
        await expect(page.getByRole('heading', { name: 'My Website' })).toBeVisible();
        await expect(page.getByRole('heading', { name: 'Welcome to Our Platform' })).toBeVisible();
        await expect(page.getByText('Enter your body text here.')).toBeVisible();
        await expect(page.getByText('Card One')).toBeVisible();
        await expect(page.getByText('Card Two')).toBeVisible();
        await expect(page.getByText('Card Three')).toBeVisible();
        await expect(page.getByText('Built with care.')).toBeVisible();

        // Verify vertical ordering: header above hero, hero above text, etc.
        const header = page.locator('.header');
        const hero = page.locator('.hero_banner');
        const textBlock = page.locator('.text_block');
        const cardRow = page.locator('.card_row');
        const footer = page.locator('.footer_simple');

        const headerBox = await header.boundingBox();
        const heroBox = await hero.boundingBox();
        const textBlockBox = await textBlock.boundingBox();
        const cardRowBox = await cardRow.boundingBox();
        const footerBox = await footer.boundingBox();

        expect(headerBox).toBeTruthy();
        expect(heroBox).toBeTruthy();
        expect(textBlockBox).toBeTruthy();
        expect(cardRowBox).toBeTruthy();
        expect(footerBox).toBeTruthy();

        expect(headerBox!.y).toBeLessThan(heroBox!.y);
        expect(heroBox!.y).toBeLessThan(textBlockBox!.y);
        expect(textBlockBox!.y).toBeLessThan(cardRowBox!.y);
        expect(cardRowBox!.y).toBeLessThan(footerBox!.y);
    });

    // ── Module Rendering ────────────────────────────────────────────────

    test('Header renders title and subtitle', async ({ page }) => {
        const header = page.locator('.header');
        await expect(header).toBeVisible();
        await expect(header.getByRole('heading', { name: 'My Website' })).toBeVisible();
        await expect(header.getByText('A tagline')).toBeVisible();
    });

    test('HeroBanner has heading, subheading, and CTA link', async ({ page }) => {
        const hero = page.locator('.hero_banner');
        await expect(hero).toBeVisible();
        await expect(
            hero.getByRole('heading', { name: 'Welcome to Our Platform' }),
        ).toBeVisible();
        await expect(
            hero.getByText('Everything you need to build and ship faster.'),
        ).toBeVisible();

        const cta = hero.getByRole('link', { name: 'Get Started' });
        await expect(cta).toBeVisible();
        await expect(cta).toHaveAttribute('href', '#');
    });

    test('TextBlock renders body text', async ({ page }) => {
        const textBlock = page.locator('.text_block');
        await expect(textBlock).toBeVisible();
        await expect(textBlock.getByText('Enter your body text here.')).toBeVisible();
    });

    test('MediaText renders image and body', async ({ page }) => {
        const mediaText = page.locator('.media_text');
        await expect(mediaText).toBeVisible();
        await expect(
            mediaText.getByText('Describe what makes this image interesting.'),
        ).toBeVisible();

        const img = mediaText.locator('img');
        await expect(img).toHaveAttribute('src', /placehold\.co/);
    });

    test('CardRow shows all three cards with correct titles', async ({ page }) => {
        const cardRow = page.locator('.card_row');
        await expect(cardRow).toBeVisible();

        const cards = cardRow.locator('.card');
        await expect(cards).toHaveCount(3);

        await expect(cards.nth(0).getByText('Card One')).toBeVisible();
        await expect(cards.nth(1).getByText('Card Two')).toBeVisible();
        await expect(cards.nth(2).getByText('Card Three')).toBeVisible();
    });

    test('FooterSimple renders tagline, copyright, and links', async ({ page }) => {
        const footer = page.locator('.footer_simple');
        await expect(footer).toBeVisible();
        await expect(footer.getByText('Built with care.')).toBeVisible();
        await expect(footer.getByText(/© \d{4} My Company/)).toBeVisible();

        const privacyLink = footer.getByRole('link', { name: 'Privacy' });
        const termsLink = footer.getByRole('link', { name: 'Terms' });
        const contactLink = footer.getByRole('link', { name: 'Contact' });

        await expect(privacyLink).toBeVisible();
        await expect(privacyLink).toHaveAttribute('href', '#privacy');
        await expect(termsLink).toBeVisible();
        await expect(termsLink).toHaveAttribute('href', '#terms');
        await expect(contactLink).toBeVisible();
        await expect(contactLink).toHaveAttribute('href', '#contact');
    });

    test('images have src attributes pointing to placehold.co', async ({ page }) => {
        const images = page.locator('img[src*="placehold.co"]');
        const count = await images.count();
        expect(count).toBeGreaterThanOrEqual(1);

        for (let i = 0; i < count; i++) {
            await expect(images.nth(i)).toHaveAttribute('src', /placehold\.co/);
        }
    });

    // ── Edit Mode ───────────────────────────────────────────────────────

    test('edit mode toolbar is visible with "Bearbeiten" button', async ({ page }) => {
        const btn = page.getByRole('button', { name: 'Bearbeiten' });
        await expect(btn).toBeVisible();
    });

    test('clicking "Bearbeiten" toggles to "Fertig"', async ({ page }) => {
        const btn = page.getByRole('button', { name: 'Bearbeiten' });
        await btn.click();
        await expect(page.getByRole('button', { name: 'Fertig' })).toBeVisible();
    });

    test('elements become contenteditable in edit mode', async ({ page }) => {
        // Before edit mode: no contenteditable elements
        const editableBefore = page.locator('[contenteditable="true"]');
        await expect(editableBefore).toHaveCount(0);

        // Enable edit mode
        await page.getByRole('button', { name: 'Bearbeiten' }).click();

        // After: contenteditable elements appear
        const editableAfter = page.locator('[contenteditable="true"]');
        const count = await editableAfter.count();
        expect(count).toBeGreaterThan(0);
    });

    test('editing header title text persists after blur', async ({ page }) => {
        // Enter edit mode
        await page.getByRole('button', { name: 'Bearbeiten' }).click();

        const titleEl = page.locator('.header__title');
        await expect(titleEl).toHaveAttribute('contenteditable', 'true');

        // Clear existing text and type new text
        await titleEl.click();
        await titleEl.selectText();
        await page.keyboard.type('New Title');

        // Blur by clicking elsewhere
        await page.locator('.hero_banner').click();

        // Title should now show the new text
        await expect(titleEl).toHaveText('New Title');
    });

    test('exiting edit mode removes contenteditable', async ({ page }) => {
        // Enter edit mode
        await page.getByRole('button', { name: 'Bearbeiten' }).click();

        // Verify contenteditable elements exist
        const editableCount = await page.locator('[contenteditable="true"]').count();
        expect(editableCount).toBeGreaterThan(0);

        // Exit edit mode
        await page.getByRole('button', { name: 'Fertig' }).click();

        // Verify contenteditable elements are removed
        await expect(page.locator('[contenteditable="true"]')).toHaveCount(0);
        await expect(page.getByRole('button', { name: 'Bearbeiten' })).toBeVisible();
    });

    // ── Visual & Layout ─────────────────────────────────────────────────

    test('page layout fills viewport width without horizontal scrollbar', async ({ page }) => {
        const layout = page.locator('.vertical_layout');
        await expect(layout).toBeVisible();

        // Check the layout fills the viewport
        const viewportWidth = page.viewportSize()!.width;
        const layoutBox = await layout.boundingBox();
        expect(layoutBox).toBeTruthy();
        expect(layoutBox!.width).toBeGreaterThanOrEqual(viewportWidth - 1);

        // Verify no horizontal overflow
        const hasHorizontalScroll = await page.evaluate(() => {
            return document.documentElement.scrollWidth > document.documentElement.clientWidth;
        });
        expect(hasHorizontalScroll).toBe(false);
    });

    test('no console errors during page load', async ({ page }) => {
        const errors: string[] = [];
        page.on('console', (msg) => {
            if (msg.type() === 'error') {
                errors.push(msg.text());
            }
        });

        // Re-navigate to capture errors from the start
        await page.goto('/');

        // Wait for content to render
        await expect(page.getByRole('heading', { name: 'My Website' })).toBeVisible();

        expect(errors).toEqual([]);
    });

    // ── Navigation ──────────────────────────────────────────────────────

    test('footer links are clickable anchor links', async ({ page }) => {
        const footer = page.locator('.footer_simple');

        const links = footer.locator('a');
        const count = await links.count();
        expect(count).toBe(3);

        for (let i = 0; i < count; i++) {
            const href = await links.nth(i).getAttribute('href');
            expect(href).toBeTruthy();
            expect(href).toMatch(/^#/);
        }
    });
});
