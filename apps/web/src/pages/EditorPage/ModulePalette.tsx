import './ModulePalette.css';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { PanelRightOpen } from 'lucide-react';
import { useDraggable } from '@dnd-kit/core';
import { listModules } from '../../builder/registry';
import { getModuleIcon } from '../../builder/iconMap';
import { useEditModeActions, useEditModeState } from '../../builder/editModeStore';
import type { ModuleDefinition } from '../../builder/types';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyModule = ModuleDefinition<any>;

const CHROME_MODULES = new Set(['Header', 'Footer', 'Container']);

const CATEGORY_ORDER = ['layout', 'content', 'media'] as const;

export function ModulePalette() {
    const { t } = useTranslation();
    const { isEditMode } = useEditModeState();
    const { addBlock, setIsEditMode } = useEditModeActions();

    const grouped = useMemo(() => groupByCategory(listModules()), []);
    const categoryLabel = {
        layout:  'Layout',
        content: t('editor.palette.categoryContent'),
        media:   t('editor.palette.categoryMedia'),
        other:   t('editor.palette.categoryOther'),
    };

    if (!isEditMode) {
        return (
            <aside
                className="module-palette module-palette--collapsed"
                aria-label={t('editor.palette.collapsedAriaLabel')}
            >
                <button
                    type="button"
                    className="module-palette__rail"
                    onClick={() => setIsEditMode(true)}
                    aria-label={t('editor.palette.openAriaLabel')}
                    title={t('editor.palette.openLabel')}
                >
                    <PanelRightOpen size={18} aria-hidden="true" />
                </button>
            </aside>
        );
    }

    return (
        <aside className="module-palette" aria-label={t('editor.palette.ariaLabel')}>
            <header className="module-palette__header">
                <h2 className="module-palette__title">{t('editor.palette.title')}</h2>
            </header>
            <div className="module-palette__scroll">
                {CATEGORY_ORDER.map((cat) => (
                    <PaletteGroup
                        key={cat}
                        label={categoryLabel[cat]}
                        modules={grouped[cat] ?? []}
                        onAdd={addBlock}
                    />
                ))}
                {grouped.other?.length ? (
                    <PaletteGroup
                        label={categoryLabel.other}
                        modules={grouped.other}
                        onAdd={addBlock}
                    />
                ) : null}
            </div>
        </aside>
    );
}

function PaletteItem({
    module: m,
    onAdd,
}: {
    module: AnyModule;
    onAdd: (type: string) => void;
}) {
    const Icon = getModuleIcon(m.meta);
    const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
        id:   `palette__${m.meta.name}`,
        data: { type: 'palette', moduleType: m.meta.name },
    });

    return (
        <li>
            <button
                ref={setNodeRef}
                type="button"
                className={`module-palette__card${isDragging ? ' module-palette__card--dragging' : ''}`}
                onClick={() => onAdd(m.meta.name)}
                title={m.meta.description}
                {...listeners}
                {...attributes}
            >
                <Icon size={16} className="module-palette__icon" aria-hidden="true" />
                <span className="module-palette__card-name">{m.meta.name}</span>
                <span className="module-palette__card-desc">{m.meta.description}</span>
            </button>
        </li>
    );
}

function PaletteGroup({
    label,
    modules,
    onAdd,
}: {
    label: string;
    modules: AnyModule[];
    onAdd: (type: string) => void;
}) {
    if (!modules.length) return null;
    return (
        <section className="module-palette__group">
            <h3 className="module-palette__group-title">{label}</h3>
            <ul className="module-palette__list">
                {modules.map((m) => (
                    <PaletteItem key={m.meta.name} module={m} onAdd={onAdd} />
                ))}
            </ul>
        </section>
    );
}

function groupByCategory(modules: AnyModule[]): Record<string, AnyModule[]> {
    const out: Record<string, AnyModule[]> = {};
    for (const m of modules) {
        if (CHROME_MODULES.has(m.meta.name)) continue;
        const cat = (CATEGORY_ORDER as readonly string[]).includes(m.meta.category)
            ? m.meta.category
            : 'other';
        (out[cat] ??= []).push(m);
    }
    return out;
}
