import './ModulePalette.css';
import { useMemo } from 'react';
import { PanelRightOpen } from 'lucide-react';
import { listModules } from '../../builder/registry';
import { getModuleIcon } from '../../builder/iconMap';
import { useEditModeActions, useEditModeState } from '../../builder/editModeStore';
import type { ModuleDefinition } from '../../builder/types';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyModule = ModuleDefinition<any>;

const CATEGORY_ORDER = ['layout', 'content', 'media'] as const;
const CATEGORY_LABEL: Record<string, string> = {
    layout:  'Layout',
    content: 'Inhalt',
    media:   'Medien',
    other:   'Sonstige',
};

export function ModulePalette() {
    const { isEditMode } = useEditModeState();
    const { addBlock, setIsEditMode } = useEditModeActions();

    const grouped = useMemo(() => groupByCategory(listModules()), []);

    if (!isEditMode) {
        return (
            <aside
                className="module-palette module-palette--collapsed"
                aria-label="Modul-Palette (geschlossen)"
            >
                <button
                    type="button"
                    className="module-palette__rail"
                    onClick={() => setIsEditMode(true)}
                    aria-label="Modul-Palette öffnen (aktiviert Bearbeitungsmodus)"
                    title="Modul-Palette öffnen"
                >
                    <PanelRightOpen size={18} aria-hidden="true" />
                </button>
            </aside>
        );
    }

    return (
        <aside className="module-palette" aria-label="Modul-Palette">
            <header className="module-palette__header">
                <h2 className="module-palette__title">Module</h2>
            </header>
            <div className="module-palette__scroll">
                {CATEGORY_ORDER.map((cat) => (
                    <PaletteGroup
                        key={cat}
                        label={CATEGORY_LABEL[cat]}
                        modules={grouped[cat] ?? []}
                        onAdd={addBlock}
                    />
                ))}
                {grouped.other?.length ? (
                    <PaletteGroup
                        label={CATEGORY_LABEL.other}
                        modules={grouped.other}
                        onAdd={addBlock}
                    />
                ) : null}
            </div>
        </aside>
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
                {modules.map((m) => {
                    const Icon = getModuleIcon(m.meta);
                    return (
                        <li key={m.meta.name}>
                            <button
                                type="button"
                                className="module-palette__card"
                                onClick={() => onAdd(m.meta.name)}
                                title={m.meta.description}
                            >
                                <Icon size={16} className="module-palette__icon" aria-hidden="true" />
                                <span className="module-palette__card-name">{m.meta.name}</span>
                                <span className="module-palette__card-desc">{m.meta.description}</span>
                            </button>
                        </li>
                    );
                })}
            </ul>
        </section>
    );
}

function groupByCategory(modules: AnyModule[]): Record<string, AnyModule[]> {
    const out: Record<string, AnyModule[]> = {};
    for (const m of modules) {
        const cat = (CATEGORY_ORDER as readonly string[]).includes(m.meta.category)
            ? m.meta.category
            : 'other';
        (out[cat] ??= []).push(m);
    }
    return out;
}
