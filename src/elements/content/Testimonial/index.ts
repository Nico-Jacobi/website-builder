import Testimonial from './Testimonial';
import { TestimonialPropsSchema, TestimonialDefaults, TestimonialMeta } from './Testimonial.schema';
import type { ModuleDefinition } from '../../../builder/types';
import type { TestimonialProps } from './Testimonial.schema';

export const TestimonialModule: ModuleDefinition<TestimonialProps> = {
    meta: TestimonialMeta,
    propsSchema: TestimonialPropsSchema,
    defaults: TestimonialDefaults,
    Component: Testimonial,
};
