import React from 'react';
import { createLiteralAttrBinding } from '../../../constants/attr-binding';
import type { Svgs } from '../../../constants/svgs';

const defaultPathSvgAttrBindings = {
    d: createLiteralAttrBinding('M 0 5 L 20 5'),
    stroke: createLiteralAttrBinding('#D6ABC1'),
    'stroke-width': createLiteralAttrBinding(5),
} satisfies Svgs['defaultAttrBindings'];

const pathIcon = (
    <svg viewBox="0 0 24 24" height={40} width={40} focusable={false}>
        <rect x="6" y="11" width="12" height="2" rx={1} fill="currentColor" />
    </svg>
);

const pathSvgs: Svgs = {
    icon: pathIcon,
    defaultAttrBindings: defaultPathSvgAttrBindings,
    displayName: 'Path',
};

export default pathSvgs;
