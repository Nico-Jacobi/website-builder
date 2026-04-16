import './Testimonial.css';
import { useEditableText } from '../../../builder/useEditableText';
import type { TestimonialProps } from './Testimonial.schema';

export default function Testimonial({ image, quote, author, title }: TestimonialProps) {
    const quoteEdit = useEditableText('quote');
    const authorEdit = useEditableText('author');
    const titleEdit = useEditableText('title');

    return (
        <div className="testimonial">
            <img src={image} alt={author} className="testimonial__image" />
            <div className="testimonial__content">
                <blockquote className="testimonial__quote" {...quoteEdit}>
                    "{quote}"
                </blockquote>
                <div className="testimonial__author-info">
                    <p className="testimonial__author" {...authorEdit}>{author}</p>
                    {title && <p className="testimonial__title" {...titleEdit}>{title}</p>}
                </div>
            </div>
        </div>
    );
}
