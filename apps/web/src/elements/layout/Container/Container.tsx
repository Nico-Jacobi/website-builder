import './Container.css';
import type { ReactNode, CSSProperties } from 'react';
import type { ContainerProps } from '@website-builder/shared';

/**
 * At render time, Renderer.tsx materializes BlockSpec[] → ReactNode[] before
 * calling this component. We declare children as ReactNode here to match what
 * the component actually receives.
 */
type ContainerRenderProps = Omit<ContainerProps, 'children'> & {
    children: ReactNode;
};

export default function Container({
    children,
    paddingY = 'md',
    maxWidth,
    scrollable = false,
    maxHeight = 400,
}: ContainerRenderProps) {
    const innerStyle: CSSProperties = {};
    if (maxWidth !== undefined) innerStyle.maxWidth = `${maxWidth}px`;

    const contentStyle: CSSProperties = {};
    if (scrollable) contentStyle.maxHeight = `${maxHeight}px`;

    return (
        <section
            className="container_block"
            data-padding-y={paddingY}
        >
            <div className="container_block__inner" style={innerStyle}>
                <div
                    className="container_block__content"
                    data-scrollable={scrollable || undefined}
                    style={contentStyle}
                >
                    {children}
                </div>
            </div>
        </section>
    );
}
