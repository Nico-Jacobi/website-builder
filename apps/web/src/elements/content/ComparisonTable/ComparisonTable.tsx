import './ComparisonTable.css';
import { useEditableText } from '../../../builder/useEditableText';
import type { ComparisonTableProps, ComparisonColumn, ComparisonRow } from '@website-builder/shared';

function renderValue(value: string | boolean) {
    if (value === true) return <span className="comparison_table__check" aria-label="Yes">✓</span>;
    if (value === false) return <span className="comparison_table__dash" aria-label="No">—</span>;
    return value;
}

export default function ComparisonTable({ heading, subheading, columns, rows }: ComparisonTableProps) {
    const headingEdit    = useEditableText('heading');
    const subheadingEdit = useEditableText('subheading');

    return (
        <div className="section comparison_table">
            {(heading || subheading) && (
                <header className="comparison_table__header">
                    {heading && <h2 className="comparison_table__heading" {...headingEdit}>{heading}</h2>}
                    {subheading && <p className="comparison_table__subheading" {...subheadingEdit}>{subheading}</p>}
                </header>
            )}
            <div className="comparison_table__scroll">
                <table className="comparison_table__table">
                    <thead>
                        <tr>
                            <th className="comparison_table__feature-col" />
                            {columns.map((col, i) => (
                                <ColHeader key={i} col={col} prefix={`columns[${i}]`} />
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {rows.map((row, i) => (
                            <RowEntry key={i} row={row} prefix={`rows[${i}]`} columns={columns} />
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

function ColHeader({ col, prefix }: { col: ComparisonColumn; prefix: string }) {
    const nameEdit = useEditableText(`${prefix}.name`);
    return (
        <th className={`comparison_table__col${col.highlight ? ' comparison_table__col--highlight' : ''}`} {...nameEdit}>
            {col.name}
        </th>
    );
}

function RowEntry({ row, prefix, columns }: { row: ComparisonRow; prefix: string; columns: ComparisonColumn[] }) {
    const labelEdit = useEditableText(`${prefix}.label`);
    return (
        <tr>
            <th className="comparison_table__feature-col" scope="row" {...labelEdit}>{row.label}</th>
            {row.values.map((value, j) => (
                <td
                    key={j}
                    className={`comparison_table__cell${columns[j]?.highlight ? ' comparison_table__cell--highlight' : ''}`}
                >
                    {renderValue(value)}
                </td>
            ))}
        </tr>
    );
}
