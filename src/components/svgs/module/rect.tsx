import React from 'react';
import { createLiteralAttrBinding } from '../../../constants/attr-binding';
import type { Svgs } from '../../../constants/svgs';

const defaultRectSvgAttrBindings = {
    width: createLiteralAttrBinding(20),
    height: createLiteralAttrBinding(10),
    rx: createLiteralAttrBinding(2),
    ry: createLiteralAttrBinding(2),
    opacity: createLiteralAttrBinding(1),
    fill: createLiteralAttrBinding('#D6ABC1'),
} satisfies Svgs['defaultAttrBindings'];

const rectIcon = (
    <svg viewBox="0 0 24 24" height={40} width={40} focusable={false}>
        <rect fill="none" stroke="currentColor" strokeWidth="1.3" x="6" y="7.5" width="12" height="10" rx="2" />
    </svg>
);

const rectSvgs: Svgs = {
    icon: rectIcon,
    defaultAttrBindings: defaultRectSvgAttrBindings,
    displayName: 'Rectangle',
};

export default rectSvgs;
