import React from 'react';
import { createLiteralAttrBinding } from '../../../constants/attr-binding';
import type { Svgs } from '../../../constants/svgs';

const defaultCircleSvgAttrBindings = {
    r: createLiteralAttrBinding(5),
    opacity: createLiteralAttrBinding(1),
    fill: createLiteralAttrBinding('#D6ABC1'),
    stroke: createLiteralAttrBinding('none'),
} satisfies Svgs['defaultAttrBindings'];

const circleIcon = (
    <svg viewBox="0 0 24 24" height={40} width={40} focusable={false}>
        <circle fill="none" stroke="currentColor" strokeWidth="1.3" cx="12" cy="12" r="6.5" />
    </svg>
);

const circleSvgs: Svgs = {
    icon: circleIcon,
    defaultAttrBindings: defaultCircleSvgAttrBindings,
    displayName: 'Circle',
};

export default circleSvgs;
