import './TeamGrid.css';
import { useTranslation } from 'react-i18next';
import { useEditableText } from '../../../builder/useEditableText';
import { EditableImage } from '../../shared/EditableImage';
import { EditableLink } from '../../shared/EditableLink';
import { useEditModeActions, useBlockIndex } from '../../../builder/editModeStore';
import { TeamGridDefaults } from '@website-builder/shared';
import type { TeamGridProps, TeamMember } from '@website-builder/shared';

export default function TeamGrid({ heading, subheading, members }: TeamGridProps) {
    const { t }          = useTranslation();
    const headingEdit    = useEditableText('heading');
    const subheadingEdit = useEditableText('subheading');
    const { addItem }    = useEditModeActions();
    const blockIndex     = useBlockIndex();

    return (
        <div className="section team_grid">
            {(heading || subheading) && (
                <header className="team_grid__header section__header">
                    {heading && <h2 className="team_grid__heading section__heading" {...headingEdit}>{heading}</h2>}
                    {subheading && <p className="team_grid__subheading section__subheading" {...subheadingEdit}>{subheading}</p>}
                </header>
            )}
            <div className="team_grid__grid">
                {members.map((member, i) => (
                    <TeamMemberCard key={i} member={member} prefix={`members[${i}]`} />
                ))}
            </div>
            <button
                className="edit__add-item"
                data-edit-only=""
                onClick={() => addItem(blockIndex, 'members', TeamGridDefaults.members[0])}
                title={t('modules.content.teamGrid.addItemLabel')}
            >+</button>
        </div>
    );
}

interface TeamMemberCardProps { member: TeamMember; prefix: string; }

function TeamMemberCard({ member, prefix }: TeamMemberCardProps) {
    const nameEdit = useEditableText(`${prefix}.name`);
    const roleEdit = useEditableText(`${prefix}.role`);
    const bioEdit  = useEditableText(`${prefix}.bio`);

    return (
        <article className="team_grid__member">
            <EditableImage
                path={`${prefix}.photoSrc`}
                src={member.photoSrc}
                alt={member.photoAlt ?? member.name}
                altPath={`${prefix}.photoAlt`}
                wrapperClassName="team_grid__photo"
            />
            <h3 className="team_grid__name" {...nameEdit}>{member.name}</h3>
            <p className="team_grid__role" {...roleEdit}>{member.role}</p>
            {member.bio && <p className="team_grid__bio" {...bioEdit}>{member.bio}</p>}
            {member.links && member.links.length > 0 && (
                <ul className="team_grid__links">
                    {member.links.map((link, j) => (
                        <li key={j}>
                            <EditableLink
                                href={link.href}
                                label={link.label}
                                labelPath={`${prefix}.links[${j}].label`}
                            />
                        </li>
                    ))}
                </ul>
            )}
        </article>
    );
}
