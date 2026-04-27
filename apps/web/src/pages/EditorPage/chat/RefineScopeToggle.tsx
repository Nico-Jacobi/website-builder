import './RefineScopeToggle.css';

export type RefineScope = 'page' | 'chrome';

interface RefineScopeToggleProps {
    value:          RefineScope;
    onChange:       (scope: RefineScope) => void;
    activePagePath: string;
}

export function RefineScopeToggle({ value, onChange, activePagePath }: RefineScopeToggleProps) {
    const pageLabel = activePagePath === '/' ? 'Home' : activePagePath;

    return (
        <div className="refine-scope-toggle" role="radiogroup" aria-label="Refine scope">
            <button
                type="button"
                role="radio"
                aria-checked={value === 'page'}
                className={`refine-scope-btn${value === 'page' ? ' refine-scope-btn--active' : ''}`}
                onClick={() => onChange('page')}
            >
                Page ({pageLabel})
            </button>
            <button
                type="button"
                role="radio"
                aria-checked={value === 'chrome'}
                className={`refine-scope-btn${value === 'chrome' ? ' refine-scope-btn--active' : ''}`}
                onClick={() => onChange('chrome')}
            >
                Header &amp; Footer
            </button>
        </div>
    );
}
