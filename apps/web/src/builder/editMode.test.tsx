import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ReactNode } from 'react';
import { EditModeProvider } from './EditModeContext';
import {
    BlockIndexContext,
    useEditModeState,
    useEditModeActions,
} from './editModeStore';
import { useEditableText } from './useEditableText';
import { useEditableImage } from './useEditableImage';
import Renderer from './Renderer';
import type { SiteSpec } from './schemas';

afterEach(() => {
    cleanup();
});

// ---------------------------------------------------------------------------
// Test helper components
// ---------------------------------------------------------------------------

/** Reads isEditMode from context and displays it. */
function TestConsumer() {
    const { isEditMode } = useEditModeState();
    return <div data-testid="consumer">{isEditMode ? 'editing' : 'viewing'}</div>;
}

/** Reads isEditMode and exposes a toggle button via setIsEditMode. */
function TestToggle() {
    const { isEditMode } = useEditModeState();
    const { setIsEditMode } = useEditModeActions();
    return (
        <div>
            <span data-testid="state">{isEditMode ? 'on' : 'off'}</span>
            <button onClick={() => setIsEditMode(!isEditMode)}>toggle</button>
        </div>
    );
}

/** Calls updateBlock when the button is clicked. */
function TestUpdater({
    blockIndex,
    propPath,
    value,
}: {
    blockIndex: number;
    propPath: string;
    value: unknown;
}) {
    const { updateBlock } = useEditModeActions();
    return (
        <button onClick={() => updateBlock(blockIndex, propPath, value)}>
            update
        </button>
    );
}

/** Wraps children in EditModeProvider with an onSpecChange spy. */
function renderWithProvider(
    ui: ReactNode,
    spec: SiteSpec,
    onSpecChange = vi.fn(),
) {
    const result = render(
        <EditModeProvider spec={spec} onSpecChange={onSpecChange}>
            {ui}
        </EditModeProvider>,
    );
    return { ...result, onSpecChange };
}

/** Spreads useEditableText props onto a <p>. */
function TestEditableText({ propPath }: { propPath: string }) {
    const editProps = useEditableText(propPath);
    return (
        <p data-testid="editable" {...editProps}>
            Some text
        </p>
    );
}

/** Renders useEditableImage overlay alongside a placeholder image. */
function TestEditableImage({
    currentSrc,
    propPath,
}: {
    currentSrc: string;
    propPath: string;
}) {
    const { overlayElement } = useEditableImage(currentSrc, propPath);
    return (
        <div data-testid="image-wrap" style={{ position: 'relative' }}>
            <img src={currentSrc} alt="test" />
            {overlayElement}
        </div>
    );
}

// ---------------------------------------------------------------------------
// EditModeProvider tests
// ---------------------------------------------------------------------------

describe('EditModeProvider', () => {
    it('renders its children', () => {
        renderWithProvider(
            <div data-testid="child">hello</div>,
            { blocks: [] },
        );
        expect(screen.getByTestId('child')).toBeInTheDocument();
    });

    it('starts with isEditMode = false', () => {
        renderWithProvider(<TestConsumer />, { blocks: [] });
        expect(screen.getByTestId('consumer')).toHaveTextContent('viewing');
    });

    it('setIsEditMode toggles edit mode on', async () => {
        renderWithProvider(<TestToggle />, { blocks: [] });

        expect(screen.getByTestId('state')).toHaveTextContent('off');

        await userEvent.click(screen.getByText('toggle'));

        expect(screen.getByTestId('state')).toHaveTextContent('on');
    });

    it('updateBlock calls onSpecChange with updated spec', async () => {
        const spec: SiteSpec = {
            blocks: [
                { type: 'TextBlock', props: { body: 'old text', align: 'left' } },
            ],
        };
        const { onSpecChange } = renderWithProvider(
            <TestUpdater blockIndex={0} propPath="body" value="new text" />,
            spec,
        );

        await userEvent.click(screen.getByText('update'));

        expect(onSpecChange).toHaveBeenCalledTimes(1);
        const updatedSpec = onSpecChange.mock.calls[0][0] as SiteSpec;
        expect(updatedSpec.blocks[0].props.body).toBe('new text');
        // Other props remain unchanged
        expect(updatedSpec.blocks[0].props.align).toBe('left');
    });

    it('updateBlock handles nested paths like cards[0].title', async () => {
        const spec: SiteSpec = {
            blocks: [
                {
                    type: 'CardRow',
                    props: {
                        cards: [
                            { title: 'Old Title', body: 'Card body' },
                            { title: 'Second', body: 'Second body' },
                        ],
                    },
                },
            ],
        };
        const { onSpecChange } = renderWithProvider(
            <TestUpdater
                blockIndex={0}
                propPath="cards[0].title"
                value="New Title"
            />,
            spec,
        );

        await userEvent.click(screen.getByText('update'));

        const updated = onSpecChange.mock.calls[0][0] as SiteSpec;
        const cards = updated.blocks[0].props.cards as Array<{
            title: string;
            body: string;
        }>;
        expect(cards[0].title).toBe('New Title');
        // Sibling data untouched
        expect(cards[0].body).toBe('Card body');
        expect(cards[1].title).toBe('Second');
    });

    it('updateBlock leaves other blocks unchanged', async () => {
        const spec: SiteSpec = {
            blocks: [
                { type: 'TextBlock', props: { body: 'block 0' } },
                { type: 'TextBlock', props: { body: 'block 1' } },
                { type: 'TextBlock', props: { body: 'block 2' } },
            ],
        };
        const { onSpecChange } = renderWithProvider(
            <TestUpdater blockIndex={1} propPath="body" value="updated block 1" />,
            spec,
        );

        await userEvent.click(screen.getByText('update'));

        const updated = onSpecChange.mock.calls[0][0] as SiteSpec;
        expect(updated.blocks[0].props.body).toBe('block 0');
        expect(updated.blocks[1].props.body).toBe('updated block 1');
        expect(updated.blocks[2].props.body).toBe('block 2');
        // Block references for untouched blocks should be identity-equal
        expect(updated.blocks[0]).toBe(spec.blocks[0]);
        expect(updated.blocks[2]).toBe(spec.blocks[2]);
    });
});

// ---------------------------------------------------------------------------
// useEditableText tests
// ---------------------------------------------------------------------------

describe('useEditableText', () => {
    it('returns empty object (no contentEditable) when not in edit mode', () => {
        renderWithProvider(<TestEditableText propPath="body" />, {
            blocks: [],
        });

        const el = screen.getByTestId('editable');
        expect(el).not.toHaveAttribute('contenteditable');
        expect(el).not.toHaveAttribute('data-edit-mode');
    });

    it('returns contentEditable props when in edit mode', async () => {
        renderWithProvider(
            <>
                <TestToggle />
                <BlockIndexContext.Provider value={0}>
                    <TestEditableText propPath="body" />
                </BlockIndexContext.Provider>
            </>,
            { blocks: [{ type: 'TextBlock', props: { body: 'test' } }] },
        );

        // Enable edit mode
        await userEvent.click(screen.getByText('toggle'));

        const el = screen.getByTestId('editable');
        expect(el).toHaveAttribute('contenteditable', 'true');
        expect(el).toHaveAttribute('data-edit-mode', 'text');
    });

    it('blur commits text change via onSpecChange', async () => {
        const spec: SiteSpec = {
            blocks: [{ type: 'TextBlock', props: { body: 'original' } }],
        };
        const onSpecChange = vi.fn();

        render(
            <EditModeProvider spec={spec} onSpecChange={onSpecChange}>
                <TestToggle />
                <BlockIndexContext.Provider value={0}>
                    <TestEditableText propPath="body" />
                </BlockIndexContext.Provider>
            </EditModeProvider>,
        );

        // Toggle into edit mode
        await userEvent.click(screen.getByText('toggle'));

        const el = screen.getByTestId('editable');
        // Simulate the user editing text content
        el.textContent = 'changed text';
        fireEvent.blur(el);

        expect(onSpecChange).toHaveBeenCalledTimes(1);
        const updated = onSpecChange.mock.calls[0][0] as SiteSpec;
        expect(updated.blocks[0].props.body).toBe('changed text');
    });
});

// ---------------------------------------------------------------------------
// useEditableImage tests
// ---------------------------------------------------------------------------

describe('useEditableImage', () => {
    it('returns null overlay when not in edit mode', () => {
        renderWithProvider(
            <BlockIndexContext.Provider value={0}>
                <TestEditableImage
                    currentSrc="https://example.com/img.jpg"
                    propPath="imageSrc"
                />
            </BlockIndexContext.Provider>,
            { blocks: [{ type: 'ImageBlock', props: { src: 'test' } }] },
        );

        // No edit button should be present
        expect(screen.queryByTitle('Swap image')).not.toBeInTheDocument();
    });

    it('shows edit button in edit mode', async () => {
        renderWithProvider(
            <>
                <TestToggle />
                <BlockIndexContext.Provider value={0}>
                    <TestEditableImage
                        currentSrc="https://example.com/img.jpg"
                        propPath="imageSrc"
                    />
                </BlockIndexContext.Provider>
            </>,
            { blocks: [{ type: 'ImageBlock', props: { src: 'test' } }] },
        );

        await userEvent.click(screen.getByText('toggle'));

        expect(screen.getByTitle('Swap image')).toBeInTheDocument();
    });

    it('opens URL input on edit button click', async () => {
        renderWithProvider(
            <>
                <TestToggle />
                <BlockIndexContext.Provider value={0}>
                    <TestEditableImage
                        currentSrc="https://example.com/img.jpg"
                        propPath="imageSrc"
                    />
                </BlockIndexContext.Provider>
            </>,
            { blocks: [{ type: 'ImageBlock', props: { src: 'test' } }] },
        );

        await userEvent.click(screen.getByText('toggle'));
        await userEvent.click(screen.getByTitle('Swap image'));

        expect(
            screen.getByPlaceholderText('Enter image URL…'),
        ).toBeInTheDocument();
        expect(screen.getByText('OK')).toBeInTheDocument();
        expect(screen.getByLabelText('Cancel')).toBeInTheDocument();
    });

    it('OK button commits new URL', async () => {
        const spec: SiteSpec = {
            blocks: [
                { type: 'ImageBlock', props: { src: 'https://example.com/old.jpg' } },
            ],
        };
        const onSpecChange = vi.fn();

        render(
            <EditModeProvider spec={spec} onSpecChange={onSpecChange}>
                <TestToggle />
                <BlockIndexContext.Provider value={0}>
                    <TestEditableImage
                        currentSrc="https://example.com/old.jpg"
                        propPath="src"
                    />
                </BlockIndexContext.Provider>
            </EditModeProvider>,
        );

        // Enter edit mode
        await userEvent.click(screen.getByText('toggle'));
        // Open URL dialog
        await userEvent.click(screen.getByTitle('Swap image'));

        const input = screen.getByPlaceholderText('Enter image URL…');
        // Clear existing value and type new URL
        await userEvent.clear(input);
        await userEvent.type(input, 'https://example.com/new.jpg');
        await userEvent.click(screen.getByText('OK'));

        expect(onSpecChange).toHaveBeenCalledTimes(1);
        const updated = onSpecChange.mock.calls[0][0] as SiteSpec;
        expect(updated.blocks[0].props.src).toBe('https://example.com/new.jpg');
    });

    it('Enter key commits new URL', async () => {
        const spec: SiteSpec = {
            blocks: [
                { type: 'ImageBlock', props: { src: 'https://example.com/old.jpg' } },
            ],
        };
        const onSpecChange = vi.fn();

        render(
            <EditModeProvider spec={spec} onSpecChange={onSpecChange}>
                <TestToggle />
                <BlockIndexContext.Provider value={0}>
                    <TestEditableImage
                        currentSrc="https://example.com/old.jpg"
                        propPath="src"
                    />
                </BlockIndexContext.Provider>
            </EditModeProvider>,
        );

        await userEvent.click(screen.getByText('toggle'));
        await userEvent.click(screen.getByTitle('Swap image'));

        const input = screen.getByPlaceholderText('Enter image URL…');
        await userEvent.clear(input);
        await userEvent.type(input, 'https://example.com/enter.jpg{Enter}');

        expect(onSpecChange).toHaveBeenCalledTimes(1);
        const updated = onSpecChange.mock.calls[0][0] as SiteSpec;
        expect(updated.blocks[0].props.src).toBe(
            'https://example.com/enter.jpg',
        );
    });

    it('Escape closes dialog without committing', async () => {
        const onSpecChange = vi.fn();

        render(
            <EditModeProvider
                spec={{
                    blocks: [
                        { type: 'ImageBlock', props: { src: 'https://example.com/img.jpg' } },
                    ],
                }}
                onSpecChange={onSpecChange}
            >
                <TestToggle />
                <BlockIndexContext.Provider value={0}>
                    <TestEditableImage
                        currentSrc="https://example.com/img.jpg"
                        propPath="src"
                    />
                </BlockIndexContext.Provider>
            </EditModeProvider>,
        );

        await userEvent.click(screen.getByText('toggle'));
        await userEvent.click(screen.getByTitle('Swap image'));

        // Verify dialog is open
        expect(
            screen.getByPlaceholderText('Enter image URL…'),
        ).toBeInTheDocument();

        // Press Escape on the input
        await userEvent.keyboard('{Escape}');

        // Dialog should be closed
        expect(
            screen.queryByPlaceholderText('Enter image URL…'),
        ).not.toBeInTheDocument();
        // No commit should have happened
        expect(onSpecChange).not.toHaveBeenCalled();
    });

    it('cancel button (✕) closes dialog without committing', async () => {
        const onSpecChange = vi.fn();

        render(
            <EditModeProvider
                spec={{
                    blocks: [
                        { type: 'ImageBlock', props: { src: 'https://example.com/img.jpg' } },
                    ],
                }}
                onSpecChange={onSpecChange}
            >
                <TestToggle />
                <BlockIndexContext.Provider value={0}>
                    <TestEditableImage
                        currentSrc="https://example.com/img.jpg"
                        propPath="src"
                    />
                </BlockIndexContext.Provider>
            </EditModeProvider>,
        );

        await userEvent.click(screen.getByText('toggle'));
        await userEvent.click(screen.getByTitle('Swap image'));

        // Click the cancel button
        await userEvent.click(screen.getByLabelText('Cancel'));

        // Dialog should be closed
        expect(
            screen.queryByPlaceholderText('Enter image URL…'),
        ).not.toBeInTheDocument();
        expect(onSpecChange).not.toHaveBeenCalled();
    });
});

// ---------------------------------------------------------------------------
// Integration: full edit flow
// ---------------------------------------------------------------------------

describe('Integration: full edit round-trip', () => {
    it('toggling edit mode makes text elements editable, blur commits change', async () => {
        const spec: SiteSpec = {
            blocks: [
                {
                    id: 'tb1',
                    type: 'TextBlock',
                    props: {
                        heading: 'My Heading',
                        body: 'My Body',
                    },
                },
            ],
        };
        const onSpecChange = vi.fn();

        render(
            <EditModeProvider spec={spec} onSpecChange={onSpecChange}>
                <TestToggle />
                <Renderer spec={spec} />
            </EditModeProvider>,
        );

        // Initially visible content
        expect(screen.getByText('My Heading')).toBeInTheDocument();
        expect(screen.getByText('My Body')).toBeInTheDocument();

        // Elements should NOT be contentEditable yet
        const heading = screen.getByText('My Heading');
        expect(heading).not.toHaveAttribute('contenteditable');

        // Toggle into edit mode via the test-only toggle (used to be the now-deleted
        // EditModeToolbar's "Bearbeiten" button).
        await userEvent.click(screen.getByText('toggle'));

        // Now elements should be contentEditable
        expect(heading).toHaveAttribute('contenteditable', 'true');
        expect(heading).toHaveAttribute('data-edit-mode', 'text');

        const body = screen.getByText('My Body');
        expect(body).toHaveAttribute('contenteditable', 'true');

        // Simulate editing and blurring
        body.textContent = 'Updated Body Text';
        fireEvent.blur(body);

        // Verify onSpecChange was called with the updated text
        expect(onSpecChange).toHaveBeenCalledTimes(1);
        const updated = onSpecChange.mock.calls[0][0] as SiteSpec;
        expect(updated.blocks[0].props.body).toBe('Updated Body Text');
        // Heading should remain unchanged
        expect(updated.blocks[0].props.heading).toBe('My Heading');
    });
});
