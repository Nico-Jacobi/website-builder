import './StatRow.css';
import { useEditableText } from '../../../builder/useEditableText';
import type { StatRowProps, Stat } from './StatRow.schema';

export default function StatRow({ stats, align }: StatRowProps) {
    return (
        <div className="section stat_row" data-align={align}>
            <div className="stat_row__tiles">
                {stats.map((stat, index) => (
                    <StatTile key={index} stat={stat} index={index} />
                ))}
            </div>
        </div>
    );
}

function StatTile({ stat, index }: { stat: Stat; index: number }) {
    const valueEdit = useEditableText(`stats[${index}].value`);
    const labelEdit = useEditableText(`stats[${index}].label`);
    return (
        <div className="stat_row__tile">
            <span className="stat_row__value" {...valueEdit}>{stat.value}</span>
            <span className="stat_row__label" {...labelEdit}>{stat.label}</span>
        </div>
    );
}
