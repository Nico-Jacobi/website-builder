import { useEditableText } from '../../builder/useEditableText';

/**
 * A link whose label is inline-editable in edit mode.
 *   <EditableLink href={link.href} label={link.label} labelPath={`links[${i}].label`} />
 */
export interface EditableLinkProps {
    href: string;
    label: string;
    labelPath: string;
    className?: string;
}

export function EditableLink({ href, label, labelPath, className }: EditableLinkProps) {
    const labelEdit = useEditableText(labelPath);
    return (
        <a className={className} href={href} {...labelEdit}>
            {label}
        </a>
    );
}
