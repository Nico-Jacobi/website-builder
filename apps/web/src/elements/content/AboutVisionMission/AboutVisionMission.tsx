import './AboutVisionMission.css';
import type { AboutVisionMissionProps } from '@website-builder/shared';

export default function AboutVisionMission({
    heading,
    vision,
    mission,
    founderPhotoSrc,
    founderPhotoAlt,
    founderName,
    founderRole,
}: AboutVisionMissionProps) {
    const hasFounder = founderName || founderPhotoSrc;

    return (
        <div className="section section--narrow about_vision_mission">
            {heading && <h2 className="about_vision_mission__heading">{heading}</h2>}
            <div className="about_vision_mission__columns">
                <div className="about_vision_mission__statement">
                    <span className="about_vision_mission__label">{vision.label}</span>
                    <p className="about_vision_mission__body">{vision.body}</p>
                </div>
                <div className="about_vision_mission__statement">
                    <span className="about_vision_mission__label">{mission.label}</span>
                    <p className="about_vision_mission__body">{mission.body}</p>
                </div>
            </div>
            {hasFounder && (
                <figure className="about_vision_mission__founder">
                    {founderPhotoSrc && (
                        <img src={founderPhotoSrc} alt={founderPhotoAlt ?? founderName ?? ''} />
                    )}
                    <figcaption>
                        {founderName && <span className="about_vision_mission__founder-name">{founderName}</span>}
                        {founderRole && <span className="about_vision_mission__founder-role">{founderRole}</span>}
                    </figcaption>
                </figure>
            )}
        </div>
    );
}
