import './TeamGrid.css';
import type { TeamGridProps } from '@website-builder/shared';

export default function TeamGrid({ heading, subheading, members }: TeamGridProps) {
    return (
        <div className="section team_grid">
            {(heading || subheading) && (
                <header className="team_grid__header">
                    {heading && <h2 className="team_grid__heading">{heading}</h2>}
                    {subheading && <p className="team_grid__subheading">{subheading}</p>}
                </header>
            )}
            <div className="team_grid__grid">
                {members.map((member, i) => (
                    <article key={i} className="team_grid__member">
                        {member.photoSrc && (
                            <div className="team_grid__photo">
                                <img src={member.photoSrc} alt={member.photoAlt ?? member.name} />
                            </div>
                        )}
                        <h3 className="team_grid__name">{member.name}</h3>
                        <p className="team_grid__role">{member.role}</p>
                        {member.bio && <p className="team_grid__bio">{member.bio}</p>}
                        {member.links && member.links.length > 0 && (
                            <ul className="team_grid__links">
                                {member.links.map((link, j) => (
                                    <li key={j}>
                                        <a href={link.href}>{link.label}</a>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </article>
                ))}
            </div>
        </div>
    );
}
