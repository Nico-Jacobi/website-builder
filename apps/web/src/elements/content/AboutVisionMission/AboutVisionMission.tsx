import './AboutVisionMission.css';
import { useEditableText } from '../../../builder/useEditableText';
import { EditableImage } from '../../shared/EditableImage';
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
    const headingEdit      = useEditableText('heading');
    const visionLabelEdit  = useEditableText('vision.label');
    const visionBodyEdit   = useEditableText('vision.body');
    const missionLabelEdit = useEditableText('mission.label');
    const missionBodyEdit  = useEditableText('mission.body');
    const founderNameEdit  = useEditableText('founderName');
    const founderRoleEdit  = useEditableText('founderRole');

    const hasFounder = founderName || founderPhotoSrc;

    return (
        <div className="section section--narrow about_vision_mission">
            {heading && <h2 className="about_vision_mission__heading" {...headingEdit}>{heading}</h2>}
            <div className="about_vision_mission__columns">
                <div className="about_vision_mission__statement">
                    <span className="about_vision_mission__label" {...visionLabelEdit}>{vision.label}</span>
                    <p className="about_vision_mission__body" {...visionBodyEdit}>{vision.body}</p>
                </div>
                <div className="about_vision_mission__statement">
                    <span className="about_vision_mission__label" {...missionLabelEdit}>{mission.label}</span>
                    <p className="about_vision_mission__body" {...missionBodyEdit}>{mission.body}</p>
                </div>
            </div>
            {hasFounder && (
                <figure className="about_vision_mission__founder">
                    <EditableImage
                        path="founderPhotoSrc"
                        src={founderPhotoSrc}
                        alt={founderPhotoAlt ?? founderName ?? ''}
                        altPath="founderPhotoAlt"
                    />
                    <figcaption>
                        {founderName && <span className="about_vision_mission__founder-name" {...founderNameEdit}>{founderName}</span>}
                        {founderRole && <span className="about_vision_mission__founder-role" {...founderRoleEdit}>{founderRole}</span>}
                    </figcaption>
                </figure>
            )}
        </div>
    );
}
