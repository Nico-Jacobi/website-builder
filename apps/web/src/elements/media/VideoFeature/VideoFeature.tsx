import './VideoFeature.css';
import type { VideoFeatureProps } from '@website-builder/shared';

export default function VideoFeature({
    heading,
    body,
    videoSrc,
    posterSrc,
    videoType,
    videoPosition,
    perspective,
    glow,
    cta,
}: VideoFeatureProps) {
    const sectionClasses = [
        'section',
        'video_feature',
        glow === 'primary' ? 'section--glow-primary' : glow === 'secondary' ? 'section--glow-secondary' : '',
        videoPosition === 'left'  ? 'video_feature--media-left'  : '',
        videoPosition === 'right' ? 'video_feature--media-right' : '',
        videoPosition === 'below' ? 'video_feature--media-below' : '',
    ].filter(Boolean).join(' ');

    const mediaClass = perspective !== 'none' ? `perspective-${perspective}` : '';

    let videoEl;
    if (videoType === 'youtube' || videoType === 'vimeo') {
        videoEl = (
            <iframe
                className={mediaClass}
                src={videoSrc}
                title="Video"
                allow="autoplay; encrypted-media; picture-in-picture"
                allowFullScreen
            />
        );
    } else {
        videoEl = (
            <video
                className={mediaClass}
                src={videoSrc}
                poster={posterSrc}
                autoPlay
                muted
                loop
                playsInline
            />
        );
    }

    return (
        <div className={sectionClasses}>
            <div className="video_feature__inner">
                <div className="video_feature__copy">
                    <h2 className="video_feature__heading">{heading}</h2>
                    {body && <p className="video_feature__body">{body}</p>}
                    {cta && (
                        <a className="video_feature__cta" href={cta.href}>{cta.label}</a>
                    )}
                </div>
                <div className="video_feature__media">{videoEl}</div>
            </div>
        </div>
    );
}
