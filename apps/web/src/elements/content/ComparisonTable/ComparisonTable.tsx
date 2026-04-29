import './ComparisonTable.css';
import type { ComparisonTableProps } from '@website-builder/shared';

function renderValue(value: string | boolean) {
    if (value === true) return <span className="comparison_table__check" aria-label="Yes">✓</span>;
    if (value === false) return <span className="comparison_table__dash" aria-label="No">—</span>;
    return value;
}

export default function ComparisonTable({ heading, subheading, columns, rows }: ComparisonTableProps) {
    return (
        <div className="section comparison_table">
            {(heading || subheading) && (
                <header className="comparison_table__header">
                    {heading && <h2 className="comparison_table__heading">{heading}</h2>}
                    {subheading && <p className="comparison_table__subheading">{subheading}</p>}
                </header>
            )}
            <div className="comparison_table__scroll">
                <table className="comparison_table__table">
                    <thead>
                        <tr>
                            <th className="comparison_table__feature-col" />
                            {columns.map((col, i) => (
                                <th
                                    key={i}
                                    className={`comparison_table__col${col.highlight ? ' comparison_table__col--highlight' : ''}`}
                                >
                                    {col.name}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {rows.map((row, i) => (
                            <tr key={i}>
                                <th className="comparison_table__feature-col" scope="row">{row.label}</th>
                                {row.values.map((value, j) => (
                                    <td
                                        key={j}
                                        className={`comparison_table__cell${columns[j]?.highlight ? ' comparison_table__cell--highlight' : ''}`}
                                    >
                                        {renderValue(value)}
                                    </td>
                                ))}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
